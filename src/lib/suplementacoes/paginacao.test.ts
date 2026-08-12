import { describe, expect, it } from "vitest";
import {
  ALTURA_LINHA_MM,
  ALTURA_LINHA_TABELA_MM,
  ALTURA_UTIL_PAGINA_MM,
  dividirEmBlocosDeNivelSuperior,
  estimarAlturaBlocoHtml,
  paginarBlocosSuplementacao,
} from "./paginacao";

describe("dividirEmBlocosDeNivelSuperior", () => {
  it("separa parágrafos, listas e tabelas consecutivos sem misturar", () => {
    const html =
      "<p>um</p><ul><li>a</li><li>b</li></ul><p>dois</p><table><tbody><tr><td>x</td></tr></tbody></table>";
    const blocos = dividirEmBlocosDeNivelSuperior(html);
    expect(blocos).toEqual([
      "<p>um</p>",
      "<ul><li>a</li><li>b</li></ul>",
      "<p>dois</p>",
      "<table><tbody><tr><td>x</td></tr></tbody></table>",
    ]);
  });

  it("ignora HTML vazio", () => {
    expect(dividirEmBlocosDeNivelSuperior("")).toEqual([]);
  });
});

describe("estimarAlturaBlocoHtml", () => {
  it("conta cada <br> como uma linha própria, não só o comprimento total", () => {
    const umaLinha = estimarAlturaBlocoHtml("<p>texto curto</p>");
    const dezLinhas = estimarAlturaBlocoHtml(`<p>${Array(10).fill("linha curta").join("<br>")}</p>`);
    // As 9 linhas <br> extras somam 9 × altura de linha — a margem de
    // bloco (fixa) é a mesma nos dois casos, então some fora da conta.
    expect(dezLinhas - umaLinha).toBeCloseTo(9 * ALTURA_LINHA_MM, 5);
  });

  it("estima tabela pelo número de linhas (<tr>) — cada linha extra pesa o mesmo, a margem de bloco é fixa", () => {
    const duasLinhas = estimarAlturaBlocoHtml(
      "<table><tbody><tr><td>a</td></tr><tr><td>b</td></tr></tbody></table>",
    );
    const quatroLinhas = estimarAlturaBlocoHtml(
      "<table><tbody><tr><td>a</td></tr><tr><td>b</td></tr><tr><td>c</td></tr><tr><td>d</td></tr></tbody></table>",
    );
    expect(quatroLinhas - duasLinhas).toBeCloseTo(2 * ALTURA_LINHA_TABELA_MM, 5);
  });
});

describe("paginarBlocosSuplementacao", () => {
  it("mantém tudo numa página só quando cabe no orçamento", () => {
    const blocos = [{ altura: 50 }, { altura: 50 }, { altura: 50 }];
    expect(paginarBlocosSuplementacao(blocos)).toEqual([blocos]);
  });

  it("nunca deixa uma página passar do orçamento por causa de um bloco novo", () => {
    const blocos = [{ altura: 150 }, { altura: 150 }];
    const paginas = paginarBlocosSuplementacao(blocos);
    expect(paginas).toHaveLength(2);
    for (const pagina of paginas) {
      const total = pagina.reduce((s, b) => s + b.altura, 0);
      expect(total).toBeLessThanOrEqual(ALTURA_UTIL_PAGINA_MM);
    }
  });

  it("nunca deixa uma página vazia sem motivo — um bloco maior que o orçamento sozinho ainda vira uma página", () => {
    const blocos = [{ altura: ALTURA_UTIL_PAGINA_MM + 50 }];
    expect(paginarBlocosSuplementacao(blocos)).toEqual([blocos]);
  });

  it("lista vazia devolve uma página vazia (nunca zero páginas)", () => {
    expect(paginarBlocosSuplementacao([])).toEqual([[]]);
  });
});
