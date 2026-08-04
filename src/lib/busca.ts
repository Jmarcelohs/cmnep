import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

// Resolve ids de pessoas cujo nome bate com o termo buscado — usado pra
// permitir buscar diárias/requerimentos etc. pelo nome do solicitante
// mesmo quando o campo fica numa tabela relacionada (pessoas).
export async function buscarIdsPessoasPorNome(supabase: SupabaseClient<Database>, busca: string) {
  const { data } = await supabase.from("pessoas").select("id").ilike("nome", `%${busca}%`);
  return (data ?? []).map((p) => p.id as string);
}

// O valor de cada condição dentro de um .or() do PostgREST precisa vir
// entre aspas duplas quando contém caracteres que o parser trata como
// delimitador da sintaxe (vírgula, parênteses, dois-pontos etc.) — sem
// isso, por exemplo, uma vírgula digitada na busca corta a string no meio
// e quebra (ou desvia) o filtro inteiro. Aspas e barras invertidas dentro
// do próprio valor precisam ser escapadas.
function citarValorFiltro(valor: string) {
  return `"${valor.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

// Monta a string do .or() do PostgREST combinando colunas de texto (ilike)
// com uma lista de ids já resolvidos (ex: pessoa_id vindo do nome).
export function construirFiltroBusca(
  busca: string,
  colunasTexto: string[],
  colunaIds?: { coluna: string; ids: string[] },
) {
  const valor = citarValorFiltro(`%${busca}%`);
  const partes = colunasTexto.map((c) => `${c}.ilike.${valor}`);
  if (colunaIds && colunaIds.ids.length > 0) {
    partes.push(`${colunaIds.coluna}.in.(${colunaIds.ids.join(",")})`);
  }
  return partes.join(",");
}
