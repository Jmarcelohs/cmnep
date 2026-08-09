import type { createClient } from "@/lib/supabase/server";
import type { Papel, StatusRequerimentoInterno, StatusRequerimentoReembolso } from "@/lib/supabase/database.types";
import { diasUteisEntre } from "@/lib/diarias/verificacoes";
import { hojeBrasil } from "@/lib/data-brasil";

export type ItemParado = { id: string; titulo: string; diasUteisParado: number };
export type RequerimentosParados = { itens: ItemParado[]; total: number };

const VAZIO: RequerimentosParados = { itens: [], total: 0 };
const LIMITE_DIAS_UTEIS = 5;

// Diferente de "diárias atrasadas" (onde quem precisa agir é quem submeteu),
// aqui quem precisa agir é quem decide — por isso não existe divisão
// "minhas"/"de outros": é sempre a fila de quem tem papel pra decidir.
export function estaParado(
  dataRequerimento: string | null,
  hoje: string,
  status: StatusRequerimentoReembolso | StatusRequerimentoInterno,
): boolean {
  if (!dataRequerimento) return false;
  if (status !== "pendente" && status !== "analise") return false;
  return diasUteisEntre(dataRequerimento, hoje) >= LIMITE_DIAS_UTEIS;
}

export async function buscarReembolsosParados(
  supabase: Awaited<ReturnType<typeof createClient>>,
  usuario: { papel: Papel } | null | undefined,
): Promise<RequerimentosParados> {
  const podeDecidir =
    usuario?.papel === "admin" || usuario?.papel === "ordenador_despesa" || usuario?.papel === "gestor_diarias";
  if (!podeDecidir) return VAZIO;

  const { data } = await supabase
    .from("requerimentos_reembolso")
    .select("id, protocolo, status, data_requerimento, pessoas(nome)");

  const hoje = hojeBrasil();
  const itens: ItemParado[] = [];

  for (const linha of data ?? []) {
    if (!estaParado(linha.data_requerimento, hoje, linha.status)) continue;
    const nome = (linha.pessoas as unknown as { nome: string } | null)?.nome ?? "—";
    itens.push({
      id: linha.id,
      titulo: `${linha.protocolo} — ${nome}`,
      diasUteisParado: diasUteisEntre(linha.data_requerimento!, hoje),
    });
  }

  return { itens, total: itens.length };
}

export async function buscarRequerimentosInternosParados(
  supabase: Awaited<ReturnType<typeof createClient>>,
  usuario: { papel: Papel } | null | undefined,
): Promise<RequerimentosParados> {
  const podeDecidir = usuario?.papel === "admin" || usuario?.papel === "ordenador_despesa";
  if (!podeDecidir) return VAZIO;

  const { data } = await supabase
    .from("requerimentos_internos")
    .select("id, numero, ano, nome, status, data_requerimento");

  const hoje = hojeBrasil();
  const itens: ItemParado[] = [];

  for (const linha of data ?? []) {
    if (!estaParado(linha.data_requerimento, hoje, linha.status)) continue;
    itens.push({
      id: linha.id,
      titulo: `${linha.numero}/${linha.ano} — ${linha.nome}`,
      diasUteisParado: diasUteisEntre(linha.data_requerimento!, hoje),
    });
  }

  return { itens, total: itens.length };
}
