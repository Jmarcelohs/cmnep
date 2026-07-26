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
