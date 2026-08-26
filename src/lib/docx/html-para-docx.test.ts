import { describe, expect, it } from "vitest";
import { Document, Packer, Paragraph, Table } from "docx";
import { converterHtmlParaDocx } from "./html-para-docx";

// Empacota os blocos convertidos num Document mínimo — a forma mais
// confiável de garantir que o docx-js aceita a estrutura gerada (um
// TextRun/Paragraph/Table mal formado lança na hora de empacotar, não na
// hora de construir o objeto).
async function empacotar(html: string) {
  const blocos = converterHtmlParaDocx(html);
  const buffer = await Packer.toBuffer(new Document({ sections: [{ children: blocos }] }));
  return { blocos, buffer };
}

describe("converterHtmlParaDocx", () => {
  it("converte um parágrafo simples", async () => {
    const { blocos, buffer } = await empacotar("<p>Texto simples.</p>");
    expect(blocos).toHaveLength(1);
    expect(blocos[0]).toBeInstanceOf(Paragraph);
    expect(buffer.subarray(0, 2).toString()).toBe("PK"); // assinatura de um .docx (zip) válido
  });

  it("mantém negrito/itálico/sublinhado aninhados sem lançar erro", async () => {
    const html = "<p>Antes <strong>negrito <em>e itálico</em></strong> depois <u>sublinhado</u>.</p>";
    const { blocos } = await empacotar(html);
    expect(blocos).toHaveLength(1);
  });

  it("não confunde um <p> dentro de uma célula de tabela com um bloco de nível superior", async () => {
    // mesmo padrão usado no DFD de Licitações (seções 6/7 de
    // documento-dfd.ts) — um <p> centralizado dentro de uma <td>.
    const html = "<table><tbody><tr><td><p>dentro da célula</p></td></tr></tbody></table>";
    const { blocos } = await empacotar(html);
    expect(blocos).toHaveLength(1);
    expect(blocos[0]).toBeInstanceOf(Table);
  });

  it("converte uma tabela com cabeçalho e larguras de célula proporcionais", async () => {
    const html =
      "<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>";
    const { blocos } = await empacotar(html);
    expect(blocos).toHaveLength(1);
    expect(blocos[0]).toBeInstanceOf(Table);
  });

  it("converte uma lista não ordenada e uma ordenada sem lançar erro", async () => {
    const html = "<ul><li>um</li><li>dois</li></ul><ol><li>primeiro</li><li>segundo</li></ol>";
    const { blocos } = await empacotar(html);
    // 2 itens da <ul> + 2 itens da <ol> = 4 parágrafos.
    expect(blocos).toHaveLength(4);
    expect(blocos.every((b) => b instanceof Paragraph)).toBe(true);
  });

  it("separa blocos de nível superior consecutivos (parágrafo + tabela + parágrafo)", async () => {
    const html = "<p>um</p><table><tbody><tr><td>x</td></tr></tbody></table><p>dois</p>";
    const { blocos } = await empacotar(html);
    expect(blocos).toHaveLength(3);
    expect(blocos[0]).toBeInstanceOf(Paragraph);
    expect(blocos[1]).toBeInstanceOf(Table);
    expect(blocos[2]).toBeInstanceOf(Paragraph);
  });

  it("não lança erro com os estilos de <p> usados pelos documentos reais (indent/align/font-size)", async () => {
    const html =
      '<p style="text-indent:1.25cm;text-align:justify;font-size:12pt">Corpo do artigo.</p>' +
      '<p style="text-align:center;font-size:18pt"><strong>TÍTULO</strong></p>' +
      '<p style="text-align:right">Nepomuceno, 10 de agosto de 2026.</p>';
    const { blocos } = await empacotar(html);
    expect(blocos).toHaveLength(3);
  });

  it("um parágrafo vazio (sem texto) ainda vira um Paragraph válido, não lança erro", async () => {
    const { blocos } = await empacotar("<p></p>");
    expect(blocos).toHaveLength(1);
  });
});
