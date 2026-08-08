import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatarData, formatarMoeda } from "@/lib/pdf/formato";
import { buscarIdsPessoasPorNome, construirFiltroBusca } from "@/lib/busca";
import { SUBASSUNTO_TITULO } from "@/lib/reembolso/documento";
import type { StatusRequerimentoReembolso } from "@/lib/supabase/database.types";

function csvEscape(valor: string) {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  analise: "Em análise",
  deferido: "Deferido",
  indeferido: "Indeferido",
};

const DECISAO_LABEL: Record<string, string> = {
  autorizado: "Autorizado",
  nao_autorizado: "Não autorizado",
};

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const busca = request.nextUrl.searchParams.get("busca");
  const anoParam = request.nextUrl.searchParams.get("ano");
  const anoSelecionado = anoParam && anoParam !== "todos" ? Number(anoParam) : new Date().getFullYear();

  let query = supabase
    .from("requerimentos_reembolso")
    .select(
      "protocolo, subassunto, municipio, valor, status, decisao, decisao_data, data_requerimento, pessoas(nome)",
    )
    .order("criado_em", { ascending: false });

  if (anoSelecionado) {
    query = query
      .gte("data_requerimento", `${anoSelecionado}-01-01`)
      .lt("data_requerimento", `${anoSelecionado + 1}-01-01`);
  }
  if (busca) {
    const idsPessoas = await buscarIdsPessoasPorNome(supabase, busca);
    query = query.or(
      construirFiltroBusca(busca, ["protocolo", "municipio"], { coluna: "pessoa_id", ids: idsPessoas }),
    );
  }

  const { data: requerimentos, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cabecalho = [
    "Protocolo",
    "Solicitante",
    "Sub-assunto",
    "Município",
    "Data do requerimento",
    "Valor",
    "Status",
    "Decisão",
    "Data da decisão",
  ];

  const linhas = (requerimentos ?? []).map((r) =>
    [
      r.protocolo,
      (r.pessoas as unknown as { nome: string } | null)?.nome ?? "",
      SUBASSUNTO_TITULO[r.subassunto as keyof typeof SUBASSUNTO_TITULO] ?? r.subassunto,
      r.municipio,
      formatarData(r.data_requerimento),
      formatarMoeda(Number(r.valor ?? 0)),
      STATUS_LABEL[r.status as StatusRequerimentoReembolso] ?? r.status,
      r.decisao ? (DECISAO_LABEL[r.decisao] ?? r.decisao) : "",
      r.decisao_data ? formatarData(r.decisao_data) : "",
    ]
      .map((campo) => csvEscape(String(campo ?? "")))
      .join(","),
  );

  const csv = [cabecalho.join(","), ...linhas].join("\r\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reembolsos.csv"`,
    },
  });
}
