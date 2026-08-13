import { describe, expect, it } from "vitest";
import { sanitizarHtmlDocumento } from "./sanitizar-html";

// Esse HTML é renderizado com a sessão autenticada de quem gera o PDF (ver
// comentário em sanitizar-html.ts), então os casos abaixo cobrem os
// vetores de XSS que a lista de tags permitidas precisa bloquear.
describe("sanitizarHtmlDocumento", () => {
  it("mantém as tags permitidas (negrito, itálico, sublinhado, listas)", () => {
    expect(sanitizarHtmlDocumento("<p>Olá <strong>mundo</strong></p>")).toBe(
      "<p>Olá <strong>mundo</strong></p>",
    );
    expect(sanitizarHtmlDocumento("<ul><li>item</li></ul>")).toBe("<ul><li>item</li></ul>");
  });

  it("mantém tabela (table/thead/tbody/tr/td/th)", () => {
    const tabela =
      "<table><thead><tr><th>Item</th></tr></thead><tbody><tr><td>Valor</td></tr></tbody></table>";
    expect(sanitizarHtmlDocumento(tabela)).toBe(tabela);
  });

  it("remove <script> por completo, incluindo o conteúdo", () => {
    expect(sanitizarHtmlDocumento('<script>alert(1)</script><p>texto</p>')).toBe("<p>texto</p>");
  });

  it("remove <img> com onerror (tag não permitida)", () => {
    expect(sanitizarHtmlDocumento('<img src=x onerror="alert(1)">')).toBe("");
  });

  it("remove <a href=\"javascript:...\"> mas mantém o texto do link", () => {
    expect(sanitizarHtmlDocumento('<a href="javascript:alert(1)">clique</a>')).toBe("clique");
  });

  it("remove <iframe> por completo", () => {
    expect(sanitizarHtmlDocumento('<iframe src="evil"></iframe>')).toBe("");
  });

  it("remove <style>", () => {
    expect(sanitizarHtmlDocumento("<style>body{}</style><p>ok</p>")).toBe("<p>ok</p>");
  });

  it("remove todo atributo mesmo em tag permitida (ex.: onclick)", () => {
    expect(sanitizarHtmlDocumento('<p onclick="alert(1)">texto</p>')).toBe("<p>texto</p>");
  });

  it("transforma <div> em <p>", () => {
    expect(sanitizarHtmlDocumento("<div>parágrafo em div</div>")).toBe("<p>parágrafo em div</p>");
  });

  it("remove tag não permitida mas preserva o texto interno (ex.: <h1>)", () => {
    expect(sanitizarHtmlDocumento("<h1>título</h1><p>corpo</p>")).toBe("título<p>corpo</p>");
  });

  it("limpa os <p></p> vazios que sobram ao redor de uma lista", () => {
    expect(sanitizarHtmlDocumento("<p><ul><li>item</li></ul></p>")).toBe("<ul><li>item</li></ul>");
  });

  it("reduz um parágrafo vazio (<p><br></p>, produzido pelo editor) a nada", () => {
    expect(sanitizarHtmlDocumento("<p><br></p>")).toBe("");
  });

  it("remove <br> solto no início de um parágrafo com texto (rouba o recuo de primeira linha)", () => {
    expect(sanitizarHtmlDocumento("<p><br />Solicito que...</p>")).toBe("<p>Solicito que...</p>");
    expect(sanitizarHtmlDocumento("<p><br><br>Duplo também.</p>")).toBe("<p>Duplo também.</p>");
  });

  it("mantém <br> no meio ou no fim de um parágrafo (espaçamento intencional)", () => {
    expect(sanitizarHtmlDocumento("<p>Meio<br />do texto.</p>")).toBe("<p>Meio<br />do texto.</p>");
    expect(sanitizarHtmlDocumento("<p>Fim do texto:<br /><br /></p>")).toBe(
      "<p>Fim do texto:<br /><br /></p>",
    );
  });

  it("mantém text-align/text-indent em <p> (botões de alinhamento/recuo do editor)", () => {
    expect(sanitizarHtmlDocumento('<p style="text-align: center;">Centro</p>')).toBe(
      '<p style="text-align:center">Centro</p>',
    );
    expect(sanitizarHtmlDocumento('<p style="text-indent: 1.25cm;">Recuado</p>')).toBe(
      '<p style="text-indent:1.25cm">Recuado</p>',
    );
  });

  it("mantém font-size em <p> só nos tamanhos da hierarquia oficial (título/subtítulo/corpo/nota)", () => {
    expect(sanitizarHtmlDocumento('<p style="font-size: 18pt;">Título</p>')).toBe(
      '<p style="font-size:18pt">Título</p>',
    );
    expect(sanitizarHtmlDocumento('<p style="font-size: 12pt;">Corpo</p>')).toBe(
      '<p style="font-size:12pt">Corpo</p>',
    );
  });

  it("rejeita font-size fora dos valores permitidos (ex.: 100pt, unidade livre)", () => {
    expect(sanitizarHtmlDocumento('<p style="font-size: 100pt;">texto</p>')).toBe("<p>texto</p>");
    expect(sanitizarHtmlDocumento('<p style="font-size: 2em;">texto</p>')).toBe("<p>texto</p>");
  });

  it("remove propriedades de estilo fora da lista permitida (ex.: color, position)", () => {
    expect(sanitizarHtmlDocumento('<p style="color: red;">texto</p>')).toBe("<p>texto</p>");
    expect(
      sanitizarHtmlDocumento('<p style="position: fixed; top: 0;">texto</p>'),
    ).toBe("<p>texto</p>");
  });

  it("rejeita valor de estilo fora do padrão esperado (ex.: url() disfarçado de text-align)", () => {
    expect(
      sanitizarHtmlDocumento('<p style="text-align: url(javascript:alert(1));">texto</p>'),
    ).toBe("<p>texto</p>");
  });

  it("não permite style em outra tag (só <p> recebe recuo/alinhamento)", () => {
    expect(sanitizarHtmlDocumento('<strong style="text-align: center;">texto</strong>')).toBe(
      "<strong>texto</strong>",
    );
  });

  it("não lança erro com HTML malformado/não fechado", () => {
    expect(() => sanitizarHtmlDocumento("<p>texto sem fechar")).not.toThrow();
    expect(sanitizarHtmlDocumento("<p>texto sem fechar")).toBe("<p>texto sem fechar</p>");
  });
});
