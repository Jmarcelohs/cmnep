import { describe, expect, it } from "vitest";
import { calcularTotalItens, calcularValorInternacional } from "./calculo";

describe("calcularTotalItens", () => {
  it("soma quantidade × valor unitário de cada item", () => {
    const total = calcularTotalItens([
      { quantidade: 2, valor_unitario: 300 },
      { quantidade: 1, valor_unitario: 150.5 },
    ]);
    expect(total).toBe(750.5);
  });

  it("retorna 0 para lista vazia", () => {
    expect(calcularTotalItens([])).toBe(0);
  });
});

describe("calcularValorInternacional", () => {
  it("aplica 120% (Art. 8º-A) sobre o valor base", () => {
    expect(calcularValorInternacional(1000)).toBe(1200);
  });

  it("arredonda para 2 casas decimais", () => {
    expect(calcularValorInternacional(100.005)).toBeCloseTo(120.01, 2);
  });

  it("valor base 0 resulta em 0", () => {
    expect(calcularValorInternacional(0)).toBe(0);
  });
});
