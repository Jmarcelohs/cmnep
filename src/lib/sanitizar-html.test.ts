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

  it("não lança erro com HTML malformado/não fechado", () => {
    expect(() => sanitizarHtmlDocumento("<p>texto sem fechar")).not.toThrow();
    expect(sanitizarHtmlDocumento("<p>texto sem fechar")).toBe("<p>texto sem fechar</p>");
  });
});
