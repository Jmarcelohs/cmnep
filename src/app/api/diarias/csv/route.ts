import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatarData, formatarMoeda } from "@/lib/pdf/formato";
import { buscarIdsPessoasPorNome, construirFiltroBusca } from "@/lib/busca";
import type { StatusDiaria } from "@/lib/supabase/database.types";

function csvEscape(valor: string) {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const status = request.nextUrl.searchParams.get("status");
  const prestacao = request.nextUrl.searchParams.get("prestacao");
  const busca = request.nextUrl.searchParams.get("busca");
  const anoParam = request.nextUrl.searchParams.get("ano");
  const anoSelecionado = anoParam && anoParam !== "todos" ? Number(anoParam) : new Date().getFullYear();

  let query = supabase
    .from("diarias_solicitacoes")
    .select(
      "numero_diaria, numero_solicitacao, municipio_destino, finalidade, status, total, data_solicitacao, pessoas(nome), diarias_prestacoes_contas(solicitacao_id, data_autenticacao_beneficiario)",
    )
    .order("criado_em", { ascending: false });

  if (status) query = query.eq("status", status as StatusDiaria);
  if (anoSelecionado) {
    query = query
      .gte("data_solicitacao", `${anoSelecionado}-01-01`)
      .lt("data_solicitacao", `${anoSelecionado + 1}-01-01`);
  }
  if (busca) {
    const idsPessoas = await buscarIdsPessoasPorNome(supabase, busca);
    query = query.or(
      construirFiltroBusca(busca, ["municipio_destino", "finalidade"], {
        coluna: "pessoa_id",
        ids: idsPessoas,
      }),
    );
  }
  if (prestacao) query = query.eq("status", "Autorizado");

  const { data: solicitacoesBrutas, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // "Pendente" inclui rascunho (prestação existe mas ainda não foi enviada
  // oficialmente) — mesmo critério já usado em src/app/(app)/diarias/page.tsx.
  const solicitacoes = (solicitacoesBrutas ?? []).filter((s) => {
    if (!prestacao) return true;
    const prestacaoDaLinha = (s.diarias_prestacoes_contas ?? [])[0] as
      | { data_autenticacao_beneficiario: string | null }
      | undefined;
    const enviada = Boolean(prestacaoDaLinha?.data_autenticacao_beneficiario);
    return prestacao === "realizada" ? enviada : !enviada;
  });

  const cabecalho = [
    "Nº diária",
    "Nº solicitação",
    "Solicitante",
    "Destino",
    "Finalidade",
    "Data da solicitação",
    "Status",
    "Total",
  ];

  const linhas = solicitacoes.map((s) =>
    [
      s.numero_diaria,
      s.numero_solicitacao,
      (s.pessoas as unknown as { nome: string } | null)?.nome ?? "",
      s.municipio_destino,
      s.finalidade,
      formatarData(s.data_solicitacao),
      s.status,
      formatarMoeda(Number(s.total ?? 0)),
    ]
      .map((campo) => csvEscape(String(campo ?? "")))
      .join(","),
  );

  const csv = [cabecalho.join(","), ...linhas].join("\r\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="diarias.csv"`,
    },
  });
}
