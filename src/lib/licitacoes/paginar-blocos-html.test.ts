import { describe, expect, it } from "vitest";
import { ALTURA_LINHA_MM, dividirBlocos, estimarAlturaTabela, paginarBlocosHtml } from "./paginar-blocos-html";

// Uma "caixa" no estilo caixaHtml (documento-comum.ts): uma tabela de
// nível superior com uma <table> de itens ANINHADA numa das células —
// exatamente a estrutura usada por documento-dfd.ts pra juntar
// "1. DO OBJETO" + a tabela DEMANDA na mesma caixa com borda contínua.
function caixaComTabelaAninhada(paragrafoLongo: string): string {
  const tabelaItens =
    "<table><thead><tr><th>ITEM</th></tr></thead><tbody><tr><td>001</td></tr></tbody></table>";
  return `<table><tbody><tr><td>1. DO OBJETO: texto curto</td></tr><tr><td>${tabelaItens}</td></tr><tr><td>2. JUSTIFICATIVA</td></tr><tr><td>${paragrafoLongo}</td></tr></tbody></table>`;
}

describe("dividirBlocos", () => {
  it("não confunde <tr> de uma tabela aninhada numa célula com <tr> de nível superior", () => {
    const html = caixaComTabelaAninhada("texto curto");
    const blocos = dividirBlocos(html);
    // é UM bloco só (a caixa inteira), não vários — a tabela de itens
    // aninhada não deveria fazer o parser "sair" da caixa no meio.
    expect(blocos).toHaveLength(1);
    expect(blocos[0].html).toBe(html);
  });

  it("não trata um <p> dentro de uma célula de tabela como bloco de nível superior", () => {
    // mesmo formato usado nas seções 6/7 do DFD: um <p> centralizado
    // dentro da célula de uma caixa, pra dar espaço antes da assinatura.
    const html = "<table><tbody><tr><td><p>assinatura</p></td></tr></tbody></table>";
    const blocos = dividirBlocos(html);
    expect(blocos).toHaveLength(1);
    expect(blocos[0].html.startsWith("<table")).toBe(true);
  });

  it("separa parágrafos e tabelas de nível superior normalmente", () => {
    const html = "<p>um</p><table><tbody><tr><td>x</td></tr></tbody></table><p>dois</p>";
    const blocos = dividirBlocos(html);
    expect(blocos.map((b) => b.html)).toEqual([
      "<p>um</p>",
      "<table><tbody><tr><td>x</td></tr></tbody></table>",
      "<p>dois</p>",
    ]);
  });
});

describe("estimarAlturaTabela", () => {
  it("cresce com o tamanho real do texto de uma célula, não fica travada num valor fixo por linha", () => {
    // Isola o efeito do texto da célula variável comparando duas caixas
    // idênticas exceto pelo parágrafo final — o resto (linha do objeto,
    // tabela de itens aninhada) pesa igual nas duas, então a diferença
    // entre elas isola exatamente o quanto o parágrafo mais longo pesou.
    const curta = estimarAlturaTabela(caixaComTabelaAninhada("frase curta."));
    const longa = estimarAlturaTabela(
      caixaComTabelaAninhada(
        "Um parágrafo bem mais longo, repetido várias vezes pra garantir que a estimativa de altura cresça de verdade com o tamanho real do texto e não fique presa num valor fixo por linha de tabela, ignorando quantas linhas o texto de fato ocupa quando quebra dentro da célula.",
      ),
    );
    // o parágrafo curto cabe numa linha (altura mínima); o longo quebra
    // em várias — a diferença deve refletir essas linhas extras, não ser
    // zero (o que aconteceria se a altura fosse só "número de <tr>").
    expect(longa - curta).toBeGreaterThan(2 * ALTURA_LINHA_MM);
  });

  it("uma linha com tabela aninhada é pelo menos tão alta quanto a tabela aninhada sozinha", () => {
    const tabelaAninhadaSozinha = estimarAlturaTabela(
      "<table><thead><tr><th>ITEM</th></tr></thead><tbody><tr><td>001</td></tr><tr><td>002</td></tr><tr><td>003</td></tr></tbody></table>",
    );
    const caixaEnvolvendo = estimarAlturaTabela(
      `<table><tbody><tr><td><table><thead><tr><th>ITEM</th></tr></thead><tbody><tr><td>001</td></tr><tr><td>002</td></tr><tr><td>003</td></tr></tbody></table></td></tr></tbody></table>`,
    );
    expect(caixaEnvolvendo).toBeGreaterThanOrEqual(tabelaAninhadaSozinha);
  });
});

describe("paginarBlocosHtml", () => {
  it("mantém conteúdo curto numa página só", () => {
    const paginas = paginarBlocosHtml("<p>conteúdo curto</p>");
    expect(paginas).toHaveLength(1);
  });

  it("nunca perde conteúdo: uma caixa maior que uma página inteira é dividida em fragmentos, não descartada", () => {
    const paragrafoBemLongo = Array(40)
      .fill(
        "Este é um parágrafo de justificativa real, bem mais longo do que o texto de exemplo, pensado pra estourar sozinho a altura de uma página inteira quando combinado com a tabela de itens na mesma caixa.",
      )
      .join(" ");
    const html = caixaComTabelaAninhada(paragrafoBemLongo);
    const paginas = paginarBlocosHtml(html);

    expect(paginas.length).toBeGreaterThan(1);
    // nada do texto real pode ter sido cortado/perdido ao dividir em
    // fragmentos — cada palavra do parágrafo original deve reaparecer em
    // algum lugar do conjunto de páginas geradas.
    const textoTotal = paginas.join(" ");
    expect(textoTotal).toContain("Este é um parágrafo de justificativa real");
    expect(textoTotal.length).toBeGreaterThanOrEqual(paragrafoBemLongo.length);
  });

  it("cada fragmento de uma caixa dividida continua sendo uma <table> válida (borda reaberta na página seguinte)", () => {
    const paragrafoBemLongo = Array(40).fill("linha de texto repetida bem longa pra forçar a quebra de página").join(" ");
    const html = caixaComTabelaAninhada(paragrafoBemLongo);
    const paginas = paginarBlocosHtml(html);
    for (const pagina of paginas) {
      expect(pagina.startsWith("<table")).toBe(true);
      expect(pagina.endsWith("</table>")).toBe(true);
    }
  });
});
