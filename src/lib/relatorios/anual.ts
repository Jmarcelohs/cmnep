import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  StatusRequerimentoInterno,
  StatusRequerimentoReembolso,
} from "@/lib/supabase/database.types";
import { calcularRankingSolicitantes, type LinhaRankingSolicitante } from "@/lib/dashboard/ranking";

export type PontoMensal = {
  mes: number;
  quantidade: number;
  valor: number;
};

export type RelatorioAnual = {
  ano: number;
  diarias: {
    solicitadas: number;
    autorizadas: number;
    indeferidas: number;
    valorAutorizado: number;
    prestacaoPendente: number;
    prestacaoConcluida: number;
    porMes: PontoMensal[];
  };
  reembolsos: {
    total: number;
    porStatus: Record<StatusRequerimentoReembolso, number>;
    valorDeferido: number;
    porMes: PontoMensal[];
  };
  requerimentosInternos: {
    total: number;
    porStatus: Record<StatusRequerimentoInterno, number>;
  };
  ranking: LinhaRankingSolicitante[];
};

function pontosMensaisVazios(): PontoMensal[] {
  return Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, quantidade: 0, valor: 0 }));
}

// Mês a partir de uma data ISO "aaaa-mm-dd" (evita usar Date/fuso pra não
// arriscar o dia 1º do mês cair no mês anterior por causa de UTC).
function mesDaData(dataISO: string): number {
  return Number(dataISO.slice(5, 7));
}

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
      .select("status, total, data_solicitacao, diarias_prestacoes_contas(id, parecer)")
      .gte("data_solicitacao", inicio)
      .lt("data_solicitacao", fim),
    supabase
      .from("requerimentos_reembolso")
      .select("status, valor, data_requerimento")
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

  const diariasPorMes = pontosMensaisVazios();
  for (const s of autorizadasLista) {
    if (!s.data_solicitacao) continue;
    const ponto = diariasPorMes[mesDaData(s.data_solicitacao) - 1];
    ponto.quantidade++;
    ponto.valor += Number(s.total ?? 0);
  }

  const porStatusReembolso: Record<StatusRequerimentoReembolso, number> = {
    pendente: 0,
    analise: 0,
    deferido: 0,
    indeferido: 0,
  };
  const reembolsosPorMes = pontosMensaisVazios();
  let valorDeferido = 0;
  for (const r of reembolsos ?? []) {
    porStatusReembolso[r.status]++;
    if (r.status === "deferido") {
      valorDeferido += Number(r.valor ?? 0);
      if (r.data_requerimento) {
        const ponto = reembolsosPorMes[mesDaData(r.data_requerimento) - 1];
        ponto.quantidade++;
        ponto.valor += Number(r.valor ?? 0);
      }
    }
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
      porMes: diariasPorMes,
    },
    reembolsos: {
      total: (reembolsos ?? []).length,
      porStatus: porStatusReembolso,
      valorDeferido,
      porMes: reembolsosPorMes,
    },
    requerimentosInternos: {
      total: (internos ?? []).length,
      porStatus: porStatusInterno,
    },
    ranking,
  };
}
