import type { createClient } from "@/lib/supabase/server";
import type { Papel } from "@/lib/supabase/database.types";

export type PessoaSemCpf = {
  id: string;
  nome: string;
};

export type PessoasSemCpf = {
  pessoas: PessoaSemCpf[];
  total: number;
};

const VAZIO: PessoasSemCpf = { pessoas: [], total: 0 };

// Indicador de qualidade de dado (não é uma pendência de fluxo, por isso
// sem badge de nav, diferente de buscarDiariasAtrasadas) — recalculado a
// cada carregamento, sem tabela própria. Só admin/ordenador_despesa veem,
// mesma regra de quem já lê pessoas_dados_sensiveis via RLS.
export async function buscarPessoasSemCpf(
  supabase: Awaited<ReturnType<typeof createClient>>,
  usuario: { papel: Papel } | null | undefined,
): Promise<PessoasSemCpf> {
  const podeVer = usuario?.papel === "admin" || usuario?.papel === "ordenador_despesa";
  if (!podeVer) return VAZIO;

  const { data } = await supabase
    .from("pessoas")
    .select("id, nome, pessoas_dados_sensiveis(cpf)")
    .eq("ativo", true)
    .order("nome");

  const pessoas: PessoaSemCpf[] = [];
  for (const linha of data ?? []) {
    const cpf = (linha.pessoas_dados_sensiveis as unknown as { cpf: string | null } | null)?.cpf;
    if (!cpf) pessoas.push({ id: linha.id, nome: linha.nome });
  }

  return { pessoas, total: pessoas.length };
}
