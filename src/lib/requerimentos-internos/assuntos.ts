import type { TipoRequerimentoInterno } from "@/lib/supabase/database.types";

export type CampoAssunto = {
  key: string;
  label: string;
  type: "date" | "text" | "select";
  options?: string[];
  required?: boolean;
};

export type Assunto = {
  key: string;
  label: string;
  // Sem "fields" (ou lista vazia) = modo manual (descrição livre).
  fields?: CampoAssunto[];
  // Se definido, o campo Fundamento fica travado com esse texto.
  fundamentoFixo?: string;
};

export const TIPO_LABEL: Record<TipoRequerimentoInterno, string> = {
  rh: "Recursos Humanos",
  presidente: "Ao Presidente",
  geral: "Geral",
};

export const TIPO_DESCRICAO: Record<TipoRequerimentoInterno, string> = {
  rh: "Solicitações ao setor de Recursos Humanos — férias, licenças, declarações e outros.",
  presidente: "Solicitações que exigem autorização do Presidente.",
  geral: "Solicitações administrativas diversas.",
};

const ASSUNTOS_RH: Assunto[] = [
  {
    key: "ferias",
    label: "Férias",
    fields: [
      { key: "dataInicio", label: "Data de Início do Gozo", type: "date", required: true },
      { key: "dataFim", label: "Data de Fim do Gozo", type: "date", required: true },
    ],
  },
  {
    key: "licencas",
    label: "Licenças",
    fields: [
      {
        key: "tipoLicenca",
        label: "Tipo de Licença",
        type: "select",
        required: true,
        options: [
          "Licença Médica",
          "Licença Maternidade",
          "Licença Paternidade",
          "Licença Prêmio",
          "Licença sem Vencimento",
          "Outra",
        ],
      },
      { key: "dataInicio", label: "Data de Início", type: "date", required: true },
      { key: "dataFim", label: "Data de Fim, se aplicável", type: "date" },
    ],
  },
  {
    key: "declaracoes",
    label: "Declarações",
    fields: [
      {
        key: "tipoDeclaracao",
        label: "Tipo de Declaração",
        type: "select",
        required: true,
        options: [
          "Declaração de Vínculo Empregatício",
          "Declaração de Tempo de Serviço",
          "Declaração de Não Acúmulo de Cargos",
          "Declaração de Frequência",
          "Outra",
        ],
      },
      { key: "finalidade", label: "Finalidade — para que se destina", type: "text", required: true },
    ],
  },
  {
    key: "dadosFuncionais",
    label: "Dados Funcionais",
    fields: [
      {
        key: "tipoAlteracao",
        label: "Tipo de Alteração/Solicitação",
        type: "select",
        required: true,
        options: [
          "Atualização de Endereço",
          "Atualização de Estado Civil",
          "Atualização de Dados Bancários",
          "Inclusão ou Alteração de Dependentes",
          "Outra",
        ],
      },
      { key: "detalhamento", label: "Detalhamento", type: "text" },
    ],
  },
  {
    key: "folgaAniversario",
    label: "Folga de Aniversário",
    fields: [{ key: "dataFolga", label: "Data Pretendida para a Folga", type: "date", required: true }],
  },
  {
    key: "adiantamento",
    label: "Adiantamento de Subsídio/Salário/Bolsa de Estágio",
    fields: [{ key: "mesReferencia", label: "Mês de Referência", type: "text", required: true }],
  },
  {
    key: "decimoTerceiro",
    label: "Pagamento da 1ª Parcela do 13º Salário",
    fields: [{ key: "anoReferencia", label: "Ano de Referência", type: "text", required: true }],
  },
  { key: "outros", label: "Outros" },
];

// As 3 categorias (RH, Ao Presidente, Geral) foram unificadas — todo
// requerimento novo agora é endereçado ao Presidente da Câmara (que
// também acumula o papel de ordenador da despesa e gestor nesta Câmara),
// então o bucket "presidente" passa a herdar o catálogo de assuntos que
// antes só existia em "rh" (férias, licenças etc. também são decididos
// por ele). "rh" e "geral" continuam existindo só pra requerimentos
// antigos já salvos com essas categorias continuarem funcionando.
const ASSUNTOS_PRESIDENTE: Assunto[] = ASSUNTOS_RH;

// "Geral" não tinha assunto pré-cadastrado — só modo manual; mantido por
// compatibilidade com requerimentos antigos.
const ASSUNTOS_GERAL: Assunto[] = [];

export const ASSUNTOS_POR_TIPO: Record<TipoRequerimentoInterno, Assunto[]> = {
  rh: ASSUNTOS_RH,
  presidente: ASSUNTOS_PRESIDENTE,
  geral: ASSUNTOS_GERAL,
};

export function getAssunto(tipo: TipoRequerimentoInterno, key: string): Assunto | undefined {
  return ASSUNTOS_POR_TIPO[tipo]?.find((a) => a.key === key);
}

const FUNDAMENTOS_RH = [
  "Lei Municipal nº 629/2017",
  "Regimento Interno (Resolução nº 35/2022)",
  "Estatuto dos Servidores Públicos do Município",
];
const FUNDAMENTOS_PRESIDENTE_ANTIGO = [
  "Resolução nº 40/2023",
  "Resolução nº 44/2023",
  "Portaria nº 021/2026",
  "Jurisprudência TCE/MG",
];
const FUNDAMENTOS_GERAL = ["Regimento Interno (Resolução nº 35/2022)", "Lei Orgânica Municipal nº 01/2019"];

export const FUNDAMENTOS_SUGERIDOS: Record<TipoRequerimentoInterno, string[]> = {
  rh: FUNDAMENTOS_RH,
  // União das sugestões das 3 categorias antigas, sem repetir — mesmo
  // motivo do catálogo de assuntos acima.
  presidente: Array.from(
    new Set([...FUNDAMENTOS_PRESIDENTE_ANTIGO, ...FUNDAMENTOS_RH, ...FUNDAMENTOS_GERAL]),
  ),
  geral: FUNDAMENTOS_GERAL,
};
