import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  StatusRequerimentoInterno,
  StatusRequerimentoReembolso,
} from "@/lib/supabase/database.types";
import { calcularRankingSolicitantes, type LinhaRankingSolicitante } from "@/lib/dashboard/ranking";

export type RelatorioAnual = {
  ano: number;
  diarias: {
    solicitadas: number;
    autorizadas: number;
    indeferidas: number;
    valorAutorizado: number;
    prestacaoPendente: number;
    prestacaoConcluida: number;
  };
  reembolsos: {
    total: number;
    porStatus: Record<StatusRequerimentoReembolso, number>;
    valorDeferido: number;
  };
  requerimentosInternos: {
    total: number;
    porStatus: Record<StatusRequerimentoInterno, number>;
  };
  ranking: LinhaRankingSolicitante[];
};

function rangeAno(ano: number) {
  return { inicio: `${ano}-01-01`, fim: `${ano + 1}-01-01` };
}

// Consolida Diárias + Reembolsos + Requerimentos Internos de um ano só —
// chamada tanto pela tela interativa quanto pela impressão e pelo CSV, pra
// não triplicar a agregação. Mesmas contagens já calculadas hoje (sem
// filtro de ano) em src/app/(app)/dashboard/page.tsx, agora escopadas ao
// range [ano-01-01, ano+1-01-01).
export async function calcularRelatorioAnual(
  supabase: SupabaseClient<Database>,
  ano: number,
): Promise<RelatorioAnual> {
  const { inicio, fim } = rangeAno(ano);

  const [{ data: diarias }, { data: reembolsos }, { data: internos }, ranking] = await Promise.all([
    supabase
      .from("diarias_solicitacoes")
      .select("status, total, diarias_prestacoes_contas(id, parecer)")
      .gte("data_solicitacao", inicio)
      .lt("data_solicitacao", fim),
    supabase
      .from("requerimentos_reembolso")
      .select("status, valor")
      .gte("data_requerimento", inicio)
      .lt("data_requerimento", fim),
    supabase
      .from("requerimentos_internos")
      .select("status")
      .gte("data_requerimento", inicio)
      .lt("data_requerimento", fim),
    calcularRankingSolicitantes(supabase, ano),
  ]);

  const listaDiarias = diarias ?? [];
  const autorizadasLista = listaDiarias.filter((s) => s.status === "Autorizado");
  const prestacaoPendente = autorizadasLista.filter((s) => {
    const prestacoes = s.diarias_prestacoes_contas as unknown as { parecer: string | null }[];
    return prestacoes.length === 0 || !prestacoes.some((p) => p.parecer);
  }).length;
  const prestacaoConcluida = autorizadasLista.length - prestacaoPendente;

  const porStatusReembolso: Record<StatusRequerimentoReembolso, number> = {
    pendente: 0,
    analise: 0,
    deferido: 0,
    indeferido: 0,
  };
  let valorDeferido = 0;
  for (const r of reembolsos ?? []) {
    porStatusReembolso[r.status]++;
    if (r.status === "deferido") valorDeferido += Number(r.valor ?? 0);
  }

  const porStatusInterno: Record<StatusRequerimentoInterno, number> = {
    pendente: 0,
    analise: 0,
    deferido: 0,
    indeferido: 0,
  };
  for (const r of internos ?? []) {
    porStatusInterno[r.status]++;
  }

  return {
    ano,
    diarias: {
      solicitadas: listaDiarias.filter((s) => s.status === "Solicitado").length,
      autorizadas: autorizadasLista.length,
      indeferidas: listaDiarias.filter((s) => s.status === "Indeferido").length,
      valorAutorizado: autorizadasLista.reduce((acc, s) => acc + Number(s.total ?? 0), 0),
      prestacaoPendente,
      prestacaoConcluida,
    },
    reembolsos: {
      total: (reembolsos ?? []).length,
      porStatus: porStatusReembolso,
      valorDeferido,
    },
    requerimentosInternos: {
      total: (internos ?? []).length,
      porStatus: porStatusInterno,
    },
    ranking,
  };
}
