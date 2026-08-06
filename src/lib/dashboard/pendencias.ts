import type { createClient } from "@/lib/supabase/server";
import type { Papel } from "@/lib/supabase/database.types";

export type ItemPendente = {
  prestacaoId: string;
  solicitacaoId: string;
  nome: string;
};

export type PendenciasPrestacaoContas = {
  aguardandoAprovacaoOrdenador: ItemPendente[];
  aguardandoBaixaTesoureiro: ItemPendente[];
  aguardandoParecerControleInterno: ItemPendente[];
  total: number;
};

const VAZIO: PendenciasPrestacaoContas = {
  aguardandoAprovacaoOrdenador: [],
  aguardandoBaixaTesoureiro: [],
  aguardandoParecerControleInterno: [],
  total: 0,
};

// Notificação "dentro do sistema" das 3 etapas de decisão da prestação de
// contas (ver src/app/(app)/diarias/prestacao-contas-actions.ts) — cada
// papel só vê a(s) etapa(s) que pode agir; admin/gestor_diarias veem as 3
// (mesmo acesso elevado que já têm nesse módulo), exceto na própria
// prestação de contas do gestor_diarias — aí o acesso elevado é conflito
// de interesse (ver mesma regra em diarias/[id]/prestacao-contas/page.tsx)
// e a pendência não conta pra ele, só pra admin/papel específico. Sem fila
// nova: só reconta, a cada carregamento, quais prestações já existentes
// ainda não têm o campo daquela etapa preenchido.
export async function buscarPendenciasPrestacaoContas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  usuario: { id: string; papel: Papel } | null | undefined,
): Promise<PendenciasPrestacaoContas> {
  const papel = usuario?.papel;
  if (!papel) return VAZIO;

  const vePendenciaOrdenador =
    papel === "ordenador_despesa" || papel === "admin" || papel === "gestor_diarias";
  const vePendenciaTesoureiro =
    papel === "tesoureiro" || papel === "admin" || papel === "gestor_diarias";
  const vePendenciaControleInterno =
    papel === "controle_interno" || papel === "admin" || papel === "gestor_diarias";

  if (!vePendenciaOrdenador && !vePendenciaTesoureiro && !vePendenciaControleInterno) return VAZIO;

  let minhaPessoaId: string | null = null;
  if (papel === "gestor_diarias") {
    const { data: minhaPessoa } = await supabase
      .from("pessoas")
      .select("id")
      .eq("usuario_id", usuario!.id)
      .maybeSingle();
    minhaPessoaId = minhaPessoa?.id ?? null;
  }

  const { data } = await supabase
    .from("diarias_prestacoes_contas")
    .select("id, solicitacao_id, pessoa_id, data_aprovacao_ordenador, tesoureiro_nome, parecer, pessoas(nome)")
    .order("criado_em", { ascending: true });

  const aguardandoAprovacaoOrdenador: ItemPendente[] = [];
  const aguardandoBaixaTesoureiro: ItemPendente[] = [];
  const aguardandoParecerControleInterno: ItemPendente[] = [];

  for (const linha of data ?? []) {
    if (papel === "gestor_diarias" && linha.pessoa_id === minhaPessoaId) continue;

    const nome = (linha.pessoas as unknown as { nome: string } | null)?.nome ?? "—";
    const item: ItemPendente = { prestacaoId: linha.id, solicitacaoId: linha.solicitacao_id!, nome };

    if (vePendenciaOrdenador && !linha.data_aprovacao_ordenador) {
      aguardandoAprovacaoOrdenador.push(item);
    }
    if (vePendenciaTesoureiro && !linha.tesoureiro_nome) {
      aguardandoBaixaTesoureiro.push(item);
    }
    if (vePendenciaControleInterno && !linha.parecer) {
      aguardandoParecerControleInterno.push(item);
    }
  }

  return {
    aguardandoAprovacaoOrdenador,
    aguardandoBaixaTesoureiro,
    aguardandoParecerControleInterno,
    total:
      aguardandoAprovacaoOrdenador.length +
      aguardandoBaixaTesoureiro.length +
      aguardandoParecerControleInterno.length,
  };
}
