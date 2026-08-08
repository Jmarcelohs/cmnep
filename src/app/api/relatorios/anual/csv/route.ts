import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatarMoeda } from "@/lib/pdf/formato";
import { calcularRelatorioAnual } from "@/lib/relatorios/anual";
import type { StatusRequerimentoInterno, StatusRequerimentoReembolso } from "@/lib/supabase/database.types";

function csvEscape(valor: string) {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

const STATUS_LABEL: Record<StatusRequerimentoInterno | StatusRequerimentoReembolso, string> = {
  pendente: "Pendente",
  analise: "Em análise",
  deferido: "Deferido",
  indeferido: "Indeferido",
};

function linha(campos: (string | number)[]) {
  return campos.map((campo) => csvEscape(String(campo ?? ""))).join(",");
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const ano = Number(request.nextUrl.searchParams.get("ano")) || new Date().getFullYear();
  const relatorio = await calcularRelatorioAnual(supabase, ano);

  const secoes: string[] = [];

  secoes.push(`Relatório Anual ${ano}`, "");

  secoes.push(
    "DIÁRIAS",
    linha(["Categoria", "Quantidade", "Valor"]),
    linha(["Solicitadas", relatorio.diarias.solicitadas, ""]),
    linha(["Autorizadas", relatorio.diarias.autorizadas, formatarMoeda(relatorio.diarias.valorAutorizado)]),
    linha(["Indeferidas", relatorio.diarias.indeferidas, ""]),
    linha(["Prestação de contas concluída", relatorio.diarias.prestacaoConcluida, ""]),
    linha(["Prestação de contas em aberto", relatorio.diarias.prestacaoPendente, ""]),
    "",
  );

  secoes.push(
    "REEMBOLSOS",
    linha(["Categoria", "Quantidade", "Valor"]),
    ...(Object.keys(relatorio.reembolsos.porStatus) as StatusRequerimentoReembolso[]).map((s) =>
      linha([
        STATUS_LABEL[s],
        relatorio.reembolsos.porStatus[s],
        s === "deferido" ? formatarMoeda(relatorio.reembolsos.valorDeferido) : "",
      ]),
    ),
    "",
  );

  secoes.push(
    "REQUERIMENTOS INTERNOS",
    linha(["Categoria", "Quantidade"]),
    ...(Object.keys(relatorio.requerimentosInternos.porStatus) as StatusRequerimentoInterno[]).map((s) =>
      linha([STATUS_LABEL[s], relatorio.requerimentosInternos.porStatus[s]]),
    ),
    "",
  );

  secoes.push(
    "RANKING DE DIÁRIAS POR SOLICITANTE",
    linha(["Nome", "Total", "Autorizadas", "Valor autorizado"]),
    ...relatorio.ranking.map((r) => linha([r.nome, r.total, r.autorizadas, formatarMoeda(r.valorAutorizado)])),
  );

  const csv = secoes.join("\r\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relatorio-anual-${ano}.csv"`,
    },
  });
}
