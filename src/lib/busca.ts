import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Resolve ids de pessoas cujo nome bate com o termo buscado — usado pra
// permitir buscar diárias/requerimentos etc. pelo nome do solicitante
// mesmo quando o campo fica numa tabela relacionada (pessoas).
export async function buscarIdsPessoasPorNome(supabase: SupabaseClient<Database>, busca: string) {
  const { data } = await supabase.from("pessoas").select("id").ilike("nome", `%${busca}%`);
  return (data ?? []).map((p) => p.id as string);
}

// Monta a string do .or() do PostgREST combinando colunas de texto (ilike)
// com uma lista de ids já resolvidos (ex: pessoa_id vindo do nome).
export function construirFiltroBusca(
  busca: string,
  colunasTexto: string[],
  colunaIds?: { coluna: string; ids: string[] },
) {
  const partes = colunasTexto.map((c) => `${c}.ilike.%${busca}%`);
  if (colunaIds && colunaIds.ids.length > 0) {
    partes.push(`${colunaIds.coluna}.in.(${colunaIds.ids.join(",")})`);
  }
  return partes.join(",");
}
