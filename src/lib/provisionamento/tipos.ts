// Provisionamento Orçamentário — cadastro de contratos administrativos
// usado pra projetar, mês a mês, o valor esperado em cada ficha
// orçamentária (ver src/lib/provisionamento/calculo.ts). Persistido no
// Supabase (migration 0049), admin-only — mesma sensibilidade de
// Suplementações Orçamentárias. É uma ferramenta de planejamento/
// rascunho interno, não uma peça orçamentária oficial.

import type { DotacaoOrcamentaria } from "@/lib/suplementacoes/documento";

// Reexporta o mesmo tipo/helpers já usados em Suplementações Orçamentárias
// (src/lib/suplementacoes/documento.ts) — é a mesma tabela de fichas, não
// faz sentido duplicar a lógica de formatação/classificação aqui.
export type { DotacaoOrcamentaria } from "@/lib/suplementacoes/documento";
export { rotuloFicha, segmentosFicha } from "@/lib/suplementacoes/documento";

export type TipoValor = "mensal" | "anual";

export type SituacaoContrato = "continua" | "vence" | "nova_licitacao";

export type IndiceCorrecao = "IPCA" | "IPCA-E" | "IGP-M" | "INPC" | "Outro";

export const INDICES_CORRECAO: IndiceCorrecao[] = ["IPCA", "IPCA-E", "IGP-M", "INPC", "Outro"];

export const SITUACOES: { valor: SituacaoContrato; label: string; descricao: string }[] = [
  {
    valor: "continua",
    label: "Segue provisionado integralmente",
    descricao: "Renovação esperada — ignora a data de fim de vigência, continua sendo reajustado normalmente.",
  },
  {
    valor: "vence",
    label: "Vence sem previsão de renovação",
    descricao: "Zerado a partir do mês seguinte ao fim da vigência atual.",
  },
  {
    valor: "nova_licitacao",
    label: "Em processo de nova licitação",
    descricao: "Substituído pelo valor estimado do novo contrato, a partir da data informada.",
  },
];

export type Contrato = {
  id: string;
  nome: string;
  fornecedor: string;
  valorVigente: number;
  tipoValor: TipoValor;
  // Datas em "YYYY-MM-DD" (mesmo formato de <input type="date">) — o
  // cálculo mensal só usa ano/mês, o dia é ignorado (ver calculo.ts).
  dataInicioVigencia: string;
  dataFimVigencia: string;
  dataProximoReajuste: string;
  indiceCorrecao: IndiceCorrecao;
  // Fração (0.05 = 5%), não o número inteiro — o formulário converte na
  // entrada/exibição.
  percentualEstimado: number;
  situacao: SituacaoContrato;
  valorNovoContratoEstimado: number | null;
  dataInicioNovoContrato: string | null;
  // Aponta pra uma ficha de dotacoes_orcamentarias (mesma tabela/cadastro
  // usado em Suplementações Orçamentárias) em vez de texto livre — ver
  // migration 0049. fichaId é o que é salvo; ficha é o registro completo
  // já resolvido (join feito em actions.ts), usado pra exibir a
  // classificação orçamentária real sem precisar buscar de novo.
  fichaId: string | null;
  ficha: DotacaoOrcamentaria | null;
  observacoes: string;
  criadoEm: string;
};

export type NovoContrato = Omit<Contrato, "id" | "criadoEm" | "ficha">;
