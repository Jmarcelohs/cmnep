import { describe, expect, it } from "vitest";
import { contarPaginasFotos, paginarTextoCorrido } from "./paginacao";

describe("contarPaginasFotos", () => {
  it("retorna 0 sem fotos nem documentos, por padrão", () => {
    expect(contarPaginasFotos(0, 0)).toBe(0);
  });

  it("retorna 1 sem fotos nem documentos quando minimoUmaPagina é true", () => {
    expect(contarPaginasFotos(0, 0, true)).toBe(1);
  });

  it("retorna 1 quando só há documentos (sem fotos)", () => {
    expect(contarPaginasFotos(0, 5, false)).toBe(1);
  });

  it("divide fotos em páginas de 2, arredondando pra cima", () => {
    expect(contarPaginasFotos(1, 0)).toBe(1);
    expect(contarPaginasFotos(2, 0)).toBe(1);
    expect(contarPaginasFotos(3, 0)).toBe(2);
    expect(contarPaginasFotos(4, 0)).toBe(2);
    expect(contarPaginasFotos(5, 0)).toBe(3);
  });
});

describe("paginarTextoCorrido", () => {
  it("retorna uma página vazia pra lista de parágrafos vazia", () => {
    expect(paginarTextoCorrido([])).toEqual([[]]);
  });

  it("mantém um único parágrafo curto numa página só", () => {
    expect(paginarTextoCorrido(["Texto curto."])).toEqual([["Texto curto."]]);
  });

  it("não quebra em duas páginas um único parágrafo que sozinho já estoura o orçamento", () => {
    const gigante = "x".repeat(3000);
    const paginas = paginarTextoCorrido([gigante]);
    expect(paginas).toHaveLength(1);
    expect(paginas[0]).toEqual([gigante]);
  });

  it("quebra em nova página quando os parágrafos acumulados estourariam o espaço da página atual", () => {
    const curtos = Array.from({ length: 16 }, (_, i) => `Parágrafo ${i}`);
    const paginas = paginarTextoCorrido(curtos);
    expect(paginas).toHaveLength(2);
    expect(paginas[0]).toHaveLength(15);
    expect(paginas[1]).toHaveLength(1);
    // Nenhum parágrafo se perde nem se duplica na quebra.
    expect(paginas.flat()).toEqual(curtos);
  });

  it("reduz o orçamento da primeira página quando alturaExtraPrimeiraPaginaMM é informado", () => {
    const curtos = Array.from({ length: 16 }, (_, i) => `Parágrafo ${i}`);
    const paginas = paginarTextoCorrido(curtos, 20);
    expect(paginas).toHaveLength(2);
    expect(paginas[0]).toHaveLength(14);
    expect(paginas[1]).toHaveLength(2);
  });
});
