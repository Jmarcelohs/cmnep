import sanitizeHtml from "sanitize-html";

// Conjunto mínimo de tags pro editor de texto rico (negrito, itálico,
// sublinhado, listas) — sem atributos, sem scripts, sem links. Esse HTML
// acaba renderizado dentro da própria página que o Puppeteer abre pra gerar
// o PDF (ver src/lib/pdf/gerar-pdf.ts), então uma tag maliciosa aqui
// rodaria com a sessão autenticada de quem gerar o PDF — por isso a
// sanitização é obrigatória tanto ao salvar quanto ao renderizar.
const TAGS_PERMITIDAS = [
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "table",
  "thead",
  "tbody",
  "tr",
  "td",
  "th",
];

export function sanitizarHtmlDocumento(html: string): string {
  const limpo = sanitizeHtml(html, {
    allowedTags: TAGS_PERMITIDAS,
    allowedAttributes: {},
    // contentEditable às vezes quebra linha com <div> em vez de <p>
    // (varia por navegador) — normaliza pra parágrafo.
    transformTags: { div: "p" },
  });

  // O comando "lista" do editor às vezes produz <p><ul>...</ul></p> — <p>
  // não pode conter <ul>, então o parser HTML fecha o <p> antes da lista e
  // sobra um <p></p> vazio logo antes e outro logo depois (efeito colateral
  // de reparsear uma aninhagem inválida). Sem isso, toda lista vira duas
  // linhas em branco extras no PDF.
  return limpo.replace(/<p>\s*(<br\s*\/?>)?\s*<\/p>/gi, "");
}
