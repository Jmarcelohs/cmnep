// Quantidade de fotos por página nas seções de comprovantes/FOTOS dos
// documentos impressos (Anexo II e requerimento de reembolso) — usado
// tanto pelos componentes que desenham essas páginas quanto pela rota que
// monta o PDF combinado, pra saber exatamente quantas páginas cada seção
// vai ocupar sem precisar renderizar antes.
export const FOTOS_POR_PAGINA = 2;

export function contarPaginasFotos(
  qtdFotos: number,
  qtdDocumentos: number,
  minimoUmaPagina = false,
): number {
  if (qtdFotos === 0 && qtdDocumentos === 0) return minimoUmaPagina ? 1 : 0;
  return qtdFotos > 0 ? Math.ceil(qtdFotos / FOTOS_POR_PAGINA) : 1;
}

// Estimativa de quantas linhas um parágrafo justificado ocupa numa página
// A4 de texto corrido (fonte 11pt, margens de 30mm, leading-relaxed) — só
// pra decidir onde quebrar a página, nunca afeta a redação em si. Estimar
// menos caracteres por linha do que o real é proposital: prefere gerar uma
// página a mais a arriscar o texto estourar por cima do rodapé do timbrado
// (já aconteceu — ver decreto-conteudo.tsx).
const CARACTERES_POR_LINHA = 90;
const ALTURA_LINHA_MM = 6.3;
const ALTURA_UTIL_PAGINA_MM = 239; // 297mm - 32mm (topo) - 26mm (rodapé), igual PaginaA4
const ALTURA_TITULO_MM = 15;
const ALTURA_BLOCO_ASSINATURA_MM = 55;

function linhasDoParagrafo(paragrafo: string): number {
  return Math.ceil(paragrafo.length / CARACTERES_POR_LINHA) + 0.5;
}

// Divide parágrafos de texto corrido (ex.: justificativa de um decreto) em
// páginas. Reserva em toda página espaço pro bloco de data + assinatura
// (não dá pra saber de antemão qual vai ser a última) e, só na primeira,
// espaço extra pro título da seção.
export function paginarTextoCorrido(paragrafos: string[]): string[][] {
  const paginas: string[][] = [];
  let paginaAtual: string[] = [];
  let linhasAtual = 0;
  let primeiraPagina = true;

  for (const paragrafo of paragrafos) {
    const budget =
      (ALTURA_UTIL_PAGINA_MM -
        ALTURA_BLOCO_ASSINATURA_MM -
        (primeiraPagina ? ALTURA_TITULO_MM : 0)) /
      ALTURA_LINHA_MM;
    const linhas = linhasDoParagrafo(paragrafo);

    if (paginaAtual.length > 0 && linhasAtual + linhas > budget) {
      paginas.push(paginaAtual);
      paginaAtual = [];
      linhasAtual = 0;
      primeiraPagina = false;
    }

    paginaAtual.push(paragrafo);
    linhasAtual += linhas;
  }

  if (paginaAtual.length > 0) paginas.push(paginaAtual);
  if (paginas.length === 0) paginas.push([]);
  return paginas;
}
