import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { ItemSuplementacao } from "@/lib/suplementacoes/documento";

// Busca a suplementação + seus itens já com a ficha (dotação) resolvida —
// reaproveitado tanto pelas páginas de impressão (Ato/Decreto) quanto pela
// tela de edição.
export async function buscarSuplementacaoCompleta(
  supabase: SupabaseClient<Database>,
  id: string,
) {
  const { data: suplementacao } = await supabase
    .from("suplementacoes_orcamentarias")
    .select("*")
    .eq("id", id)
    .single();

  if (!suplementacao) return null;

  const { data: itens } = await supabase
    .from("suplementacoes_itens")
    .select("id, tipo, valor, ordem, ficha_id, dotacoes_orcamentarias(*)")
    .eq("suplementacao_id", id)
    .order("ordem", { ascending: true });

  const paraItem = (
    i: NonNullable<typeof itens>[number],
  ): ItemSuplementacao => ({
    valor: i.valor,
    dotacao: i.dotacoes_orcamentarias as unknown as Database["public"]["Tables"]["dotacoes_orcamentarias"]["Row"],
  });

  const itensDestino = (itens ?? []).filter((i) => i.tipo === "destino").map(paraItem);
  const itensOrigem = (itens ?? []).filter((i) => i.tipo === "origem").map(paraItem);

  return { suplementacao, itensDestino, itensOrigem };
}
