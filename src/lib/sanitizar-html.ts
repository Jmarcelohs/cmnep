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
    // Só "style" em <p>, e só as 2 propriedades usadas pelos botões de
    // recuo/alinhamento do editor (ver rich-text-editor.tsx) — nada de
    // url()/expression()/atributo livre. Os valores são sempre gerados pelo
    // próprio editor (nunca digitados por quem usa), mas a validação por
    // regex garante isso mesmo que o HTML salvo seja adulterado depois.
    allowedAttributes: { p: ["style"] },
    allowedStyles: {
      p: {
        "text-align": [/^(left|center|right|justify)$/],
        "text-indent": [/^-?\d+(\.\d+)?(cm|mm|px|em|rem)$/],
      },
    },
    // contentEditable às vezes quebra linha com <div> em vez de <p>
    // (varia por navegador) — normaliza pra parágrafo.
    transformTags: { div: "p" },
  });

  // O comando "lista" do editor às vezes produz <p><ul>...</ul></p> — <p>
  // não pode conter <ul>, então o parser HTML fecha o <p> antes da lista e
  // sobra um <p></p> vazio logo antes e outro logo depois (efeito colateral
  // de reparsear uma aninhagem inválida). Sem isso, toda lista vira duas
  // linhas em branco extras no PDF. "(?:\s[^>]*)?" tolera o <p style="...">
  // que os botões de recuo/alinhamento podem deixar num parágrafo esvaziado.
  const semParagrafosVazios = limpo.replace(
    /<p(?:\s[^>]*)?>\s*(<br\s*\/?>)?\s*<\/p>/gi,
    "",
  );

  // Um <br> logo no início de um <p> com texto depois (ex.: sobra de inserir
  // uma tabela no meio do texto, ou um Shift+Enter em vez de Enter) rouba o
  // recuo de primeira linha do parágrafo no PDF — text-indent só afeta a
  // primeira linha do bloco, e essa linha vazia "usa" o recuo no lugar da
  // frase de verdade. Um <br> logo no início nunca é intencional (espaço
  // entre parágrafos já vem da margem entre blocos, não de dentro de um).
  return semParagrafosVazios.replace(
    /<p((?:\s[^>]*)?)>(?:\s*<br\s*\/?>)+(?=\s*\S)/gi,
    "<p$1>",
  );
}
