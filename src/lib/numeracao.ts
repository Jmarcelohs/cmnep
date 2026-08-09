// Próximo número sequencial de um ano: maior número já usado + 1, ou o
// valor de fallback se ainda não existe nenhum registro naquele ano.
export function proximoNumero(numerosExistentes: (string | number)[], fallback = 1): number {
  const maior = numerosExistentes.reduce<number>((max, n) => Math.max(max, Number(n) || 0), 0);
  return maior > 0 ? maior + 1 : fallback;
}

// Próximo "número da solicitação" no formato "NNN/AAAA" — sequência própria
// por solicitante, reiniciando em 001 a cada ano novo (mesma convenção já
// usada na planilha externa de controle das diárias). `valoresExistentes` é
// a lista de numero_solicitacao já usados por essa pessoa, de qualquer ano
// (a função filtra pelo ano pedido antes de calcular o próximo).
export function proximoNumeroSolicitacaoAno(
  valoresExistentes: (string | null)[],
  ano: number,
): string {
  const doAno = valoresExistentes
    .filter((v): v is string => v !== null && v.trim().endsWith(`/${ano}`))
    .map((v) => Number(v.trim().split("/")[0]));
  const proximo = proximoNumero(doAno, 1);
  return `${String(proximo).padStart(3, "0")}/${ano}`;
}
