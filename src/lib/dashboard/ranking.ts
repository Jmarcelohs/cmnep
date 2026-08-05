import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type LinhaRankingSolicitante = {
  nome: string;
  total: number;
  autorizadas: number;
  valorAutorizado: number;
  ultimaSolicitacao: string | null;
  // Número da diária/solicitação referentes à última solicitação (acima) —
  // não faz sentido resumir todos os números de quem tem mais de uma diária,
  // então mostramos os da mais recente, junto com a data dela.
  numeroDiaria: string | null;
  numeroSolicitacao: string | null;
};

// Maior nº de diária primeiro; quem não tem número (null/inválido) vai
// pro fim da lista em vez de embolar com os números reais.
function numeroOuMinimo(valor: string | null) {
  const n = Number(valor);
  return valor && !Number.isNaN(n) ? n : -Infinity;
}

// Ranking de diárias por solicitante, ordenado pelo nº da diária mais
// recente de cada um em ordem decrescente (não pelo total) — reaproveitado
// pelo Painel e pela exportação em CSV/PDF, pra não duplicar a mesma
// agregação em dois lugares.
export async function calcularRankingSolicitantes(
  supabase: SupabaseClient<Database>,
): Promise<LinhaRankingSolicitante[]> {
  const { data: solicitacoes } = await supabase
    .from("diarias_solicitacoes")
    .select("status, total, data_solicitacao, numero_diaria, numero_solicitacao, pessoas(nome)");

  const porSolicitante = new Map<string, LinhaRankingSolicitante>();

  for (const s of solicitacoes ?? []) {
    const nome = (s.pessoas as unknown as { nome: string } | null)?.nome ?? "—";
    const atual = porSolicitante.get(nome) ?? {
      nome,
      total: 0,
      autorizadas: 0,
      valorAutorizado: 0,
      ultimaSolicitacao: null,
      numeroDiaria: null,
      numeroSolicitacao: null,
    };
    atual.total += 1;
    if (s.status === "Autorizado") {
      atual.autorizadas += 1;
      atual.valorAutorizado += Number(s.total ?? 0);
    }
    if (!atual.ultimaSolicitacao || (s.data_solicitacao && s.data_solicitacao > atual.ultimaSolicitacao)) {
      atual.ultimaSolicitacao = s.data_solicitacao;
      atual.numeroDiaria = s.numero_diaria;
      atual.numeroSolicitacao = s.numero_solicitacao;
    }
    porSolicitante.set(nome, atual);
  }

  return Array.from(porSolicitante.values()).sort(
    (a, b) => numeroOuMinimo(b.numeroDiaria) - numeroOuMinimo(a.numeroDiaria),
  );
}
