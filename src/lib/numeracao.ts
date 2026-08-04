// Próximo número sequencial de um ano: maior número já usado + 1, ou o
// valor de fallback se ainda não existe nenhum registro naquele ano.
export function proximoNumero(numerosExistentes: (string | number)[], fallback = 1): number {
  const maior = numerosExistentes.reduce<number>((max, n) => Math.max(max, Number(n) || 0), 0);
  return maior > 0 ? maior + 1 : fallback;
}
