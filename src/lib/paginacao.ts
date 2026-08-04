export const POR_PAGINA = 50;

export function calcularPagina(paginaStr: string | undefined) {
  const pagina = Math.max(1, Number(paginaStr) || 1);
  const de = (pagina - 1) * POR_PAGINA;
  const ate = de + POR_PAGINA - 1;
  return { pagina, de, ate };
}

export function totalDePaginas(count: number | null) {
  return count ? Math.ceil(count / POR_PAGINA) : 1;
}
