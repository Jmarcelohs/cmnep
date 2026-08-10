import { dataPorExtenso } from "@/lib/pdf/formato";
import { PRESIDENTE_PADRAO } from "@/lib/reembolso/documento";
import type { TipoMocao } from "@/lib/supabase/database.types";

export const NOME_CAMARA = "Câmara Municipal de Nepomuceno";
export const UF = "MG";
export const PRESIDENTE = PRESIDENTE_PADRAO;

// Art. 117 do Regimento Interno da Câmara Municipal de Nepomuceno.
export const LABEL_TIPO_MOCAO: Record<TipoMocao, string> = {
  louvor: "Moção de Louvor",
  congratulacoes: "Moção de Congratulações",
  pesar: "Moção de Pesar",
  repudio: "Moção de Repúdio",
};

export function tituloMocao(tipo: TipoMocao) {
  return LABEL_TIPO_MOCAO[tipo].toUpperCase();
}

// Frase de apresentação, uma por tipo — muda o verbo/preposição conforme o
// caráter da moção (uma homenagem "a" alguém não se apresenta do mesmo
// jeito que um repúdio "a" uma conduta, ou um pesar "pelo falecimento de").
export function fraseApresentacaoMocao({
  tipo,
  destinatario,
}: {
  tipo: TipoMocao;
  destinatario: string;
}): string {
  const dest = destinatario || "[destinatário]";
  switch (tipo) {
    case "louvor":
      return `apresenta MOÇÃO DE LOUVOR a ${dest}, pelos motivos a seguir expostos:`;
    case "congratulacoes":
      return `apresenta MOÇÃO DE CONGRATULAÇÕES a ${dest}, pelos motivos a seguir expostos:`;
    case "pesar":
      return `apresenta MOÇÃO DE PESAR pelo falecimento de ${dest}, pelos motivos a seguir expostos:`;
    case "repudio":
      return `apresenta MOÇÃO DE REPÚDIO em relação a ${dest}, pelos motivos a seguir expostos:`;
  }
}

export function corpoAberturaMocao({
  tipo,
  destinatario,
  autorNome,
  autorPartido,
}: {
  tipo: TipoMocao;
  destinatario: string;
  autorNome: string;
  autorPartido: string | null;
}): string {
  const autor = autorNome || "[autor]";
  const partido = autorPartido ? ` (${autorPartido})` : "";
  return (
    `A ${NOME_CAMARA} – ${UF}, por intermédio do(a) Vereador(a) ${autor}${partido}, nos termos ` +
    `regimentais (art. 117 do Regimento Interno), ${fraseApresentacaoMocao({ tipo, destinatario })}`
  );
}

export function fechoMocao(dataMocao: string): string {
  return `Sala das Sessões, ${dataPorExtenso(dataMocao)}.`;
}
