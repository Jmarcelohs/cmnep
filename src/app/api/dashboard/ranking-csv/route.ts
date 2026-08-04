import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calcularRankingSolicitantes } from "@/lib/dashboard/ranking";
import { formatarData, formatarMoeda } from "@/lib/pdf/formato";

function csvEscape(valor: string) {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const ranking = await calcularRankingSolicitantes(supabase);

  const cabecalho = [
    "Solicitante",
    "Nº diária",
    "Nº solicitação",
    "Última solicitação",
    "Total de diárias",
    "Autorizadas",
    "Valor autorizado",
  ];

  const linhas = ranking.map((r) =>
    [
      r.nome,
      r.numeroDiaria ?? "",
      r.numeroSolicitacao ?? "",
      formatarData(r.ultimaSolicitacao),
      String(r.total),
      String(r.autorizadas),
      formatarMoeda(r.valorAutorizado),
    ]
      .map((campo) => csvEscape(campo))
      .join(","),
  );

  const csv = [cabecalho.join(","), ...linhas].join("\r\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="diarias-por-solicitante.csv"`,
    },
  });
}
