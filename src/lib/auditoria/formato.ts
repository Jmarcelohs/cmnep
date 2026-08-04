export const TABELA_LABEL: Record<string, string> = {
  diarias_solicitacoes: "Diária — Solicitação",
  diarias_prestacoes_contas: "Diária — Prestação de Contas",
  diarias_prestacoes_pagamentos: "Diária — Pagamento",
  requerimentos_internos: "Requerimento Interno",
  requerimentos_reembolso: "Reembolso",
  veiculos_locacao_solicitacoes: "Locação de Veículo",
  decretos_titulo_honorario: "Decreto — Título Honorário",
  pessoas: "Pessoa",
  usuarios: "Usuário",
  avaliacoes: "Avaliação",
};

export const OPERACAO_LABEL: Record<string, string> = {
  INSERT: "Criação",
  UPDATE: "Edição",
  DELETE: "Exclusão",
};

export const OPERACAO_STYLES: Record<string, string> = {
  INSERT: "bg-emerald-50 text-emerald-700",
  UPDATE: "bg-amber-50 text-amber-700",
  DELETE: "bg-red-50 text-red-700",
};

// Campos técnicos que não interessam mostrar num diff legível — ruído,
// não decisão nem dado de negócio.
const CAMPOS_IGNORADOS = new Set(["id", "criado_em", "criado_por", "atualizado_em"]);

// Ordem de preferência pra escolher qual campo representa "o título" do
// registro na listagem — primeiro que existir e tiver valor, vence.
const CAMPOS_TITULO = [
  "nome",
  "nome_homenageado",
  "assunto",
  "numero_solicitacao",
  "numero",
  "protocolo",
  "email",
];

export function tituloRegistro(
  dadosNovos: Record<string, unknown> | null,
  dadosAntigos: Record<string, unknown> | null,
): string {
  const dados = dadosNovos ?? dadosAntigos ?? {};
  for (const campo of CAMPOS_TITULO) {
    const valor = dados[campo];
    if (typeof valor === "string" && valor.trim()) return valor;
  }
  return "—";
}

function formatarValor(valor: unknown): string {
  if (valor === null || valor === undefined) return "—";
  if (typeof valor === "boolean") return valor ? "sim" : "não";
  if (typeof valor === "object") return JSON.stringify(valor);
  return String(valor);
}

export type CampoAlterado = { campo: string; de: string; para: string };

// Compara dados_antigos e dados_novos e devolve só os campos que
// realmente mudaram — usado pra mostrar um diff legível nas edições.
export function camposAlterados(
  dadosAntigos: Record<string, unknown> | null,
  dadosNovos: Record<string, unknown> | null,
): CampoAlterado[] {
  if (!dadosAntigos || !dadosNovos) return [];

  const chaves = new Set([...Object.keys(dadosAntigos), ...Object.keys(dadosNovos)]);
  const alteracoes: CampoAlterado[] = [];

  for (const campo of chaves) {
    if (CAMPOS_IGNORADOS.has(campo)) continue;
    const antes = dadosAntigos[campo];
    const depois = dadosNovos[campo];
    if (JSON.stringify(antes) === JSON.stringify(depois)) continue;
    alteracoes.push({ campo, de: formatarValor(antes), para: formatarValor(depois) });
  }

  return alteracoes;
}
