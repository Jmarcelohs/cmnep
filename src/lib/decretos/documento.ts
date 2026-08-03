import { dataPorExtenso } from "@/lib/pdf/formato";
import type { Tratamento } from "@/lib/supabase/database.types";

export const NOME_CAMARA = "Câmara Municipal de Nepomuceno";
export const UF = "MG";

export const SUBTITULO_TITULO_HONORARIO =
  "AUTORIZA CONCESSÃO DE TÍTULO DE CIDADÃO HONORÁRIO DE NEPOMUCENO e dá outras providências.";

export const DOTACAO_ORCAMENTARIA_PADRAO = "01.01.031.0001.2002.339031";

// Pareceres das comissões permanentes que todo Projeto de Decreto
// Legislativo passa antes de ir a plenário — página fixa do modelo (não
// depende do homenageado), com espaço em branco pra data e assinatura
// preenchidas à mão. Composição das comissões da legislatura atual; se a
// composição mudar, atualizar aqui.
export type ComposicaoComissao = { titulo: string; membros: string[] };

export const COMISSAO_CCJ: ComposicaoComissao = {
  titulo: "Comissão de Constituição e Justiça",
  membros: [
    "Thuler Adriano Spuri – Presidente (Avante)",
    "Marcos Memento – (PT)",
    "Mário Cezar Batista Leandro – (PL)",
  ],
};

export const COMISSAO_FINANCAS: ComposicaoComissao = {
  titulo: "Comissão de Finanças, Orçamento e Tomada de Contas",
  membros: [
    "Marcos Memento – Presidente (PT)",
    "Rogério de Paula Pedroso – (PL)",
    "Thuler Adriano Spuri – (Avante)",
  ],
};

export function tituloProjetoDecreto({ numero, dataDecreto }: { numero: string; dataDecreto: string }) {
  return `PROJETO DE DECRETO LEGISLATIVO Nº ${numero}, de ${dataPorExtenso(dataDecreto)}.`;
}

// Texto padronizado dos 4 artigos do decreto de título de cidadão
// honorário — reproduz a redação já usada nos projetos de decreto reais da
// Câmara (ex.: Projeto nº 263/2026, Eduardo Augusto da Mata Coelho),
// trocando só o que varia de um decreto pro outro.
export function artigosTituloHonorario({
  tratamento,
  nomeHomenageado,
  dotacaoOrcamentaria,
}: {
  tratamento: Tratamento;
  nomeHomenageado: string;
  dotacaoOrcamentaria: string;
}): string[] {
  const artigo = tratamento === "Sra." ? "à Sra." : "ao Sr.";
  return [
    `Art. 1° – Fica concedido o Título de Cidadão Honorário de Nepomuceno ${artigo} ${nomeHomenageado}.`,
    "Art. 2° – Caberá à Mesa Diretora da Câmara mandar confeccionar o diploma, o qual será entregue em sessão solene conjunta, convocada para essa finalidade.",
    `Art. 3° – As despesas com a execução do presente Decreto Legislativo serão suportadas pela dotação orçamentária nº ${dotacaoOrcamentaria} – Premiações.`,
    "Art. 4° – Este Decreto Legislativo entra em vigor na data de sua publicação, revogadas as disposições em contrário.",
  ];
}
