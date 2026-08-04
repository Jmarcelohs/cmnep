export function calcularTotalItens(itens: { quantidade: number; valor_unitario: number }[]): number {
  return itens.reduce((acc, item) => acc + item.quantidade * item.valor_unitario, 0);
}

// Art. 8º-A (Resolução 51): diária internacional = 120% do valor base
// (Brasília/capitais, categoria Vereador), arredondado pra 2 casas decimais.
export function calcularValorInternacional(valorBase: number): number {
  return Math.round(valorBase * 1.2 * 100) / 100;
}
