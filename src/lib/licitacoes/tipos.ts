// Licitações — processos administrativos de contratação (dispensa,
// inexigibilidade, pregão) e os documentos que os compõem. Ver migration
// 0051. Um processo é o registro central; os documentos (capa, DFD, ETP,
// TR...) não têm numeração própria, só referenciam os dados do processo.

export type ModalidadeProcesso = "dispensa" | "inexigibilidade" | "pregao";

export const MODALIDADES_PROCESSO: { valor: ModalidadeProcesso; label: string; rotuloDocumento: string }[] = [
  { valor: "dispensa", label: "Dispensa de Licitação", rotuloDocumento: "DISPENSA DE LICITAÇÃO" },
  { valor: "inexigibilidade", label: "Inexigibilidade de Licitação", rotuloDocumento: "INEXIGIBILIDADE DE LICITAÇÃO" },
  { valor: "pregao", label: "Pregão Eletrônico", rotuloDocumento: "PREGÃO ELETRÔNICO" },
];

export function rotuloModalidade(modalidade: ModalidadeProcesso): string {
  return MODALIDADES_PROCESSO.find((m) => m.valor === modalidade)?.rotuloDocumento ?? modalidade;
}

// Só "capa", "solicitacao_compra" e "tr" têm gerador de texto implementado
// por enquanto — os demais vão sendo adicionados conforme o usuário for
// passando os modelos. "solicitacao_compra" empacota, num PDF só,
// Solicitação + Proposta Comercial em branco + TR + Anexo I (confirmado
// com o usuário) — e reaproveita o mesmo corpo do TR que o documento "tr"
// autônomo usa (ver src/lib/licitacoes/documento-tr.ts).
export type TipoDocumentoLicitacao =
  | "capa"
  | "dfd"
  | "etp"
  | "tr"
  | "certidao_valor"
  | "solicitacao_abertura"
  | "termo_aceite"
  | "solicitacao_compra"
  | "solicitacao_orcamento"
  | "certidao_orcamento"
  | "solicitacao_parecer_juridico"
  | "aviso"
  | "termo_aviso"
  | "ata_julgamento"
  | "despacho"
  | "relatorio_publicacao"
  | "autuacao";

export const DOCUMENTOS_PROCESSO: { tipo: TipoDocumentoLicitacao; label: string; disponivel: boolean }[] = [
  { tipo: "autuacao", label: "Autuação", disponivel: false },
  { tipo: "capa", label: "Capa do Processo", disponivel: true },
  { tipo: "dfd", label: "DFD — Documento de Formalização de Demanda", disponivel: true },
  { tipo: "etp", label: "ETP — Estudo Técnico Preliminar", disponivel: false },
  {
    tipo: "solicitacao_compra",
    label: "Solicitação de Compra (Solicitação + Proposta + TR + Anexo I)",
    disponivel: true,
  },
  { tipo: "tr", label: "TR — Termo de Referência", disponivel: true },
  { tipo: "certidao_valor", label: "Certidão de Valor", disponivel: false },
  { tipo: "solicitacao_abertura", label: "Solicitação de Abertura de Processo", disponivel: false },
  { tipo: "termo_aceite", label: "Termo de Aceite de Gestor e Fiscal do Contrato", disponivel: false },
  { tipo: "solicitacao_orcamento", label: "Solicitação de Orçamento", disponivel: false },
  { tipo: "certidao_orcamento", label: "Certidão de Orçamento", disponivel: false },
  { tipo: "solicitacao_parecer_juridico", label: "Solicitação do Parecer Jurídico", disponivel: false },
  { tipo: "aviso", label: "Aviso", disponivel: false },
  { tipo: "termo_aviso", label: "Termo do Aviso", disponivel: false },
  { tipo: "ata_julgamento", label: "Ata de Julgamento", disponivel: false },
  { tipo: "despacho", label: "Despacho", disponivel: false },
  { tipo: "relatorio_publicacao", label: "Relatório de Publicação", disponivel: false },
];

export type PessoaResumo = {
  id: string;
  nome: string;
  cargo: string;
  genero: "M" | "F" | null;
};

export type Processo = {
  id: string;
  numeroProcesso: number;
  ano: number;
  modalidade: ModalidadeProcesso;
  numeroModalidade: number;
  dataAbertura: string;
  objeto: string;
  fichaId: string | null;
  dotacaoSubelemento: string;
  vinculoPca: string;
  organizadorPessoaId: string | null;
  agenteContratacaoPessoaId: string | null;
  // Responsável por receber a solicitação de cotação/pesquisa de preços
  // (destinatário da Solicitação de Compra) — e gestor/fiscal do futuro
  // contrato, já usados pelo Termo de Referência (seção 11) e mais tarde
  // pelo Termo de Aceite de Gestor e Fiscal.
  pesquisaPrecosPessoaId: string | null;
  gestorContratoPessoaId: string | null;
  fiscalContratoPessoaId: string | null;
  criadoEm: string;
};

export type NovoProcesso = Omit<Processo, "id" | "criadoEm">;

export type DocumentoProcesso = {
  id: string;
  processoId: string;
  tipo: TipoDocumentoLicitacao;
  corpoHtml: string;
  criadoEm: string;
  atualizadoEm: string;
};

// Item da tabela "DEMANDA – BEM/SERVIÇO/OBRAS E/OU INSTALAÇÕES", que
// aparece igual na Solicitação, na Proposta Comercial (em branco) e no TR —
// um cadastro só, reaproveitado pelos três. valorUnitario/valorGlobal
// ficam null até a pesquisa de preço definir.
export type ItemProcesso = {
  id: string;
  processoId: string;
  numeroItem: number;
  objeto: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number | null;
  valorGlobal: number | null;
};

export type NovoItemProcesso = Omit<ItemProcesso, "id" | "processoId">;

// "PROCEDIMENTO ADMINISTRATIVO Nº 058/2026"
export function rotuloNumeroProcesso(processo: Pick<Processo, "numeroProcesso" | "ano">): string {
  return `${String(processo.numeroProcesso).padStart(3, "0")}/${processo.ano}`;
}

// "DISPENSA DE LICITAÇÃO Nº 027/2026"
export function rotuloNumeroModalidade(
  processo: Pick<Processo, "modalidade" | "numeroModalidade" | "ano">,
): string {
  return `${String(processo.numeroModalidade).padStart(3, "0")}/${processo.ano}`;
}
