import { dataPorExtenso } from "@/lib/pdf/formato";
import type { TipoMocao } from "@/lib/supabase/database.types";

export const NOME_CAMARA = "Câmara Municipal de Nepomuceno";
export const UF = "MG";

export const LABEL_TIPO_MOCAO: Record<TipoMocao, string> = {
  aplauso_congratulacoes: "Moção de Aplauso e Congratulações",
  pesar_condolencias: "Moção de Pesar e Condolências",
  repudio: "Moção de Repúdio",
  apoio: "Moção de Apoio",
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
    case "aplauso_congratulacoes":
      return `apresenta MOÇÃO DE APLAUSO E CONGRATULAÇÕES a ${dest}, pelos motivos a seguir expostos:`;
    case "pesar_condolencias":
      return `apresenta MOÇÃO DE PESAR, com apresentação de condolências, pelo falecimento de ${dest}, pelos motivos a seguir expostos:`;
    case "repudio":
      return `apresenta MOÇÃO DE REPÚDIO em relação a ${dest}, pelos motivos a seguir expostos:`;
    case "apoio":
      return `apresenta MOÇÃO DE APOIO a ${dest}, pelos motivos a seguir expostos:`;
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
    `regimentais, ${fraseApresentacaoMocao({ tipo, destinatario })}`
  );
}

export function fechoMocao(dataMocao: string): string {
  return `Sala das Sessões, ${dataPorExtenso(dataMocao)}.`;
}
