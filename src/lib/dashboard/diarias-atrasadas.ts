import type { createClient } from "@/lib/supabase/server";
import type { Papel } from "@/lib/supabase/database.types";
import { diasUteisEntre } from "@/lib/diarias/verificacoes";

export type ItemAtrasado = {
  solicitacaoId: string;
  nome: string;
  dataChegada: string;
  diasUteisAtraso: number;
};

export type DiariasAtrasadas = {
  minhas: ItemAtrasado[];
  deOutros: ItemAtrasado[];
  total: number;
};

const VAZIO: DiariasAtrasadas = { minhas: [], deOutros: [], total: 0 };

const LIMITE_DIAS_UTEIS = 3;

// Mesma regra de "atrasada" usada no filtro prestacao=pendente da lista de
// diárias: rascunho (prestação existe mas data_autenticacao_beneficiario é
// nula) conta como "ainda não enviada", não como concluída.
export function estaAtrasada({
  dataChegada,
  hoje,
  temPrestacaoEnviada,
}: {
  dataChegada: string | null;
  hoje: string;
  temPrestacaoEnviada: boolean;
}): boolean {
  if (!dataChegada || temPrestacaoEnviada) return false;
  return diasUteisEntre(dataChegada, hoje) >= LIMITE_DIAS_UTEIS;
}

// Lembrete "dentro do sistema" de diária autorizada sem prestação de contas
// enviada 3+ dias úteis após o retorno — recalculado a cada carregamento,
// sem tabela de notificação própria (mesmo padrão de
// buscarPendenciasPrestacaoContas). `minhas` é sempre o que pertence à
// pessoa logada; `deOutros` só é preenchido pra admin/gestor_diarias, que
// são quem de fato cobra os demais.
export async function buscarDiariasAtrasadas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  usuario: { id: string; papel: Papel } | null | undefined,
): Promise<DiariasAtrasadas> {
  if (!usuario) return VAZIO;

  const veOutros = usuario.papel === "admin" || usuario.papel === "gestor_diarias";

  const { data: minhaPessoa } = await supabase
    .from("pessoas")
    .select("id")
    .eq("usuario_id", usuario.id)
    .maybeSingle();

  if (!minhaPessoa && !veOutros) return VAZIO;

  const { data } = await supabase
    .from("diarias_solicitacoes")
    .select(
      "id, pessoa_id, municipio_destino, data_chegada, pessoas(nome), diarias_prestacoes_contas(data_autenticacao_beneficiario)",
    )
    .eq("status", "Autorizado")
    .not("data_chegada", "is", null);

  const hoje = new Date().toISOString().slice(0, 10);
  const minhas: ItemAtrasado[] = [];
  const deOutros: ItemAtrasado[] = [];

  for (const linha of data ?? []) {
    const prestacoes = linha.diarias_prestacoes_contas as unknown as
      | { data_autenticacao_beneficiario: string | null }[]
      | null;
    const temPrestacaoEnviada = (prestacoes ?? []).some((p) => p.data_autenticacao_beneficiario);

    if (!estaAtrasada({ dataChegada: linha.data_chegada, hoje, temPrestacaoEnviada })) continue;

    const nome = (linha.pessoas as unknown as { nome: string } | null)?.nome ?? "—";
    const item: ItemAtrasado = {
      solicitacaoId: linha.id,
      nome: `${nome} — ${linha.municipio_destino}`,
      dataChegada: linha.data_chegada!,
      diasUteisAtraso: diasUteisEntre(linha.data_chegada!, hoje),
    };

    if (minhaPessoa && linha.pessoa_id === minhaPessoa.id) {
      minhas.push(item);
    } else if (veOutros) {
      deOutros.push(item);
    }
  }

  return { minhas, deOutros, total: minhas.length + deOutros.length };
}
