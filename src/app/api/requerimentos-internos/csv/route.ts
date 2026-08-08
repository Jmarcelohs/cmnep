import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatarData } from "@/lib/pdf/formato";
import { TIPO_LABEL } from "@/lib/requerimentos-internos/assuntos";
import type { StatusRequerimentoInterno, TipoRequerimentoInterno } from "@/lib/supabase/database.types";

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

  const tipo = request.nextUrl.searchParams.get("tipo");
  const status = request.nextUrl.searchParams.get("status");
  const anoParam = request.nextUrl.searchParams.get("ano");
  const anoSelecionado = anoParam && anoParam !== "todos" ? Number(anoParam) : null;

  let query = supabase
    .from("requerimentos_internos")
    .select("numero, ano, tipo, nome, cargo, assunto, data_requerimento, status, decisao, decisao_data")
    .order("ano", { ascending: false })
    .order("numero", { ascending: false });

  if (tipo) query = query.eq("tipo", tipo as TipoRequerimentoInterno);
  if (status) query = query.eq("status", status as StatusRequerimentoInterno);
  if (anoSelecionado) {
    query = query
      .gte("data_requerimento", `${anoSelecionado}-01-01`)
      .lt("data_requerimento", `${anoSelecionado + 1}-01-01`);
  }

  const { data: requerimentos, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cabecalho = [
    "Protocolo",
    "Tipo",
    "Solicitante",
    "Cargo",
    "Assunto",
    "Data",
    "Status",
    "Decisão",
    "Data da decisão",
  ];

  const linhas = (requerimentos ?? []).map((r) =>
    [
      `${r.numero}/${r.ano}`,
      TIPO_LABEL[r.tipo as TipoRequerimentoInterno],
      r.nome,
      r.cargo,
      r.assunto,
      formatarData(r.data_requerimento),
      STATUS_LABEL[r.status] ?? r.status,
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
      "Content-Disposition": `attachment; filename="requerimentos-internos.csv"`,
    },
  });
}
