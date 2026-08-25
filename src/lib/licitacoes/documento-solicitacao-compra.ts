import type { Processo } from "./tipos";

function primeiraLetraMinuscula(texto: string): string {
  return texto ? texto.charAt(0).toLowerCase() + texto.slice(1) : texto;
}

// Parágrafo central da carta de Solicitação (pesquisa de preços) —
// guardado como HTML editável (mesmo padrão da Capa). "Prezado(a)" e o
// objeto reaproveitam o texto real do modelo, só trocando o nome do
// destinatário e reescrevendo o objeto em letra minúscula pra encaixar na
// frase "para subsidiar a contratação de...".
export function montarParagrafoSolicitacaoCompra({ processo }: { processo: Processo }): string {
  return `<p>Em conformidade com o art. 23 da Lei Federal nº 14.133/2021, que estabelece as normas gerais de licitação e de contratação para a administração pública, SOLICITO que vossa senhoria, como agente público do Setor de Contratações Públicas da Câmara Municipal de Nepomuceno, realize a cotação de preços para os itens listados abaixo. Esta solicitação visa a realização de pesquisa de mercado para subsidiar a ${primeiraLetraMinuscula(processo.objeto)}</p>`;
}
