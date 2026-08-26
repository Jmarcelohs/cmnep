import { AlignmentType, BorderStyle, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from "docx";

// Converte o HTML já sanitizado (ver sanitizar-html.ts) num array de
// blocos docx (Paragraph/Table), pra montar o .docx de qualquer módulo
// que guarda o corpo do documento como HTML editável pelo rich-text-editor
// (Suplementações hoje; Licitações usa o mesmo sanitizador, então serve
// pra lá também se um dia precisar). Cobre exatamente a gramática que
// TAGS_PERMITIDAS/allowedStyles em sanitizar-html.ts aceitam — nunca mais
// que isso, já que o HTML de entrada nunca deveria conter outra coisa.

type NoHtml =
  | { tipo: "texto"; valor: string }
  | { tipo: "elemento"; tag: string; estilo: Record<string, string>; filhos: NoHtml[] };

const TAGS_VAZIAS = new Set(["br"]);

function decodificarEntidades(texto: string): string {
  return texto
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseEstilo(atributosHtml: string): Record<string, string> {
  const m = atributosHtml.match(/style\s*=\s*"([^"]*)"/i);
  if (!m) return {};
  const estilo: Record<string, string> = {};
  for (const par of m[1].split(";")) {
    const [chave, ...resto] = par.split(":");
    const valor = resto.join(":").trim();
    if (chave && valor) estilo[chave.trim().toLowerCase()] = valor;
  }
  return estilo;
}

// Parser mínimo — assume HTML bem-formado (o sanitizador só produz
// tags/aninhamento válidos), então uma pilha simples já resolve.
function parseHtml(html: string): NoHtml[] {
  const regexToken = /<(\/?)([a-z]+)([^>]*)>|([^<]+)/gi;
  const raiz: NoHtml[] = [];
  const pilha: NoHtml[][] = [raiz];
  let m: RegExpExecArray | null;
  while ((m = regexToken.exec(html))) {
    const [, fechando, tagBruta, atributos, texto] = m;
    if (texto !== undefined) {
      const valor = decodificarEntidades(texto);
      if (valor) pilha[pilha.length - 1].push({ tipo: "texto", valor });
      continue;
    }
    const tag = tagBruta.toLowerCase();
    if (fechando) {
      if (pilha.length > 1) pilha.pop();
      continue;
    }
    const no: NoHtml = { tipo: "elemento", tag, estilo: parseEstilo(atributos), filhos: [] };
    pilha[pilha.length - 1].push(no);
    if (!TAGS_VAZIAS.has(tag)) pilha.push(no.filhos);
  }
  return raiz;
}

// 1440 twips = 1 polegada = 2,54cm. Só cm/mm/px/em/rem aparecem (mesmas
// unidades que o sanitizador aceita pra text-indent) — em/rem tratados
// como px (16px = 1rem, aproximação padrão de navegador).
function paraTwips(valorComUnidade: string): number {
  const m = valorComUnidade.match(/^(-?\d+(?:\.\d+)?)(cm|mm|px|em|rem)$/);
  if (!m) return 0;
  const numero = Number(m[1]);
  const unidade = m[2];
  const polegadas =
    unidade === "cm"
      ? numero / 2.54
      : unidade === "mm"
        ? numero / 25.4
        : /* px, em, rem — 96px/96 unidades por polegada */ numero / 96;
  return Math.round(polegadas * 1440);
}

function alinhamentoDoEstilo(estilo: Record<string, string>) {
  switch (estilo["text-align"]) {
    case "center":
      return AlignmentType.CENTER;
    case "right":
      return AlignmentType.RIGHT;
    case "justify":
      return AlignmentType.JUSTIFIED;
    default:
      return undefined;
  }
}

function indentacaoDoEstilo(estilo: Record<string, string>) {
  if (!estilo["text-indent"]) return undefined;
  const twips = paraTwips(estilo["text-indent"]);
  if (!twips) return undefined;
  return twips < 0 ? { hanging: -twips } : { firstLine: twips };
}

function tamanhoMeioPontos(estilo: Record<string, string>): number | undefined {
  const m = estilo["font-size"]?.match(/^(\d+)pt$/);
  return m ? Number(m[1]) * 2 : undefined;
}

function nomeFonte(estilo: Record<string, string>): string | undefined {
  const valor = estilo["font-family"];
  if (!valor) return undefined;
  return valor.startsWith("Arial") ? "Arial" : valor.includes("Times") ? "Times New Roman" : undefined;
}

type EstiloInline = { bold?: boolean; italics?: boolean; underline?: Record<string, never> };

// Percorre os filhos inline de um <p>/<li>/<td> coletando TextRuns —
// <strong>/<b>, <em>/<i>, <u> acumulam o estilo pros textos dentro deles;
// <br> vira uma quebra de linha; <span> (checkbox de formulário — ver
// checkboxHtml em documento-comum.ts) não tem equivalente útil num
// parágrafo de Word, então só repassa o texto (se houver) sem a caixa.
function coletarRuns(
  nos: NoHtml[],
  estiloAtivo: EstiloInline,
  tamanho?: number,
  fonte?: string,
): TextRun[] {
  const runs: TextRun[] = [];
  for (const no of nos) {
    if (no.tipo === "texto") {
      runs.push(
        new TextRun({
          text: no.valor,
          bold: estiloAtivo.bold,
          italics: estiloAtivo.italics,
          underline: estiloAtivo.underline,
          size: tamanho,
          font: fonte,
        }),
      );
      continue;
    }
    if (no.tag === "br") {
      runs.push(new TextRun({ text: "", break: 1 }));
    } else if (no.tag === "strong" || no.tag === "b") {
      runs.push(...coletarRuns(no.filhos, { ...estiloAtivo, bold: true }, tamanho, fonte));
    } else if (no.tag === "em" || no.tag === "i") {
      runs.push(...coletarRuns(no.filhos, { ...estiloAtivo, italics: true }, tamanho, fonte));
    } else if (no.tag === "u") {
      runs.push(...coletarRuns(no.filhos, { ...estiloAtivo, underline: {} }, tamanho, fonte));
    } else if (no.tag === "span") {
      runs.push(...coletarRuns(no.filhos, estiloAtivo, tamanho, fonte));
    }
  }
  return runs;
}

const BORDA_CELULA = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
};

function elementosDeTag(nos: NoHtml[], tag: string): Extract<NoHtml, { tipo: "elemento" }>[] {
  return nos.filter((n): n is Extract<NoHtml, { tipo: "elemento" }> => n.tipo === "elemento" && n.tag === tag);
}

function converterTabela(no: Extract<NoHtml, { tipo: "elemento" }>): Table {
  // <tr> pode estar direto na <table> ou dentro de <thead>/<tbody> — achata
  // os dois casos, já que pro Word não faz diferença estrutural aqui.
  const linhasNos = no.filhos.flatMap((filho) =>
    filho.tipo === "elemento" && (filho.tag === "thead" || filho.tag === "tbody")
      ? elementosDeTag(filho.filhos, "tr")
      : filho.tipo === "elemento" && filho.tag === "tr"
        ? [filho]
        : [],
  );

  const linhas = linhasNos.map((tr) => {
    const celulasNos = tr.filhos.filter(
      (f): f is Extract<NoHtml, { tipo: "elemento" }> =>
        f.tipo === "elemento" && (f.tag === "td" || f.tag === "th"),
    );
    const largura = celulasNos.length > 0 ? 100 / celulasNos.length : 100;
    const celulas = celulasNos.map(
      (celula) =>
        new TableCell({
          width: { size: largura, type: WidthType.PERCENTAGE },
          borders: BORDA_CELULA,
          children: [
            new Paragraph({
              children: coletarRuns(celula.filhos, celula.tag === "th" ? { bold: true } : {}),
            }),
          ],
        }),
    );
    return new TableRow({ children: celulas });
  });

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: linhas });
}

function converterLista(no: Extract<NoHtml, { tipo: "elemento" }>): Paragraph[] {
  const itens = elementosDeTag(no.filhos, "li");
  return itens.map((li, indice) => {
    const prefixo = no.tag === "ol" ? `${indice + 1}. ` : undefined;
    const runs = coletarRuns(li.filhos, {});
    return new Paragraph({
      bullet: no.tag === "ul" ? { level: 0 } : undefined,
      children: prefixo ? [new TextRun({ text: prefixo }), ...runs] : runs,
    });
  });
}

function converterBloco(no: NoHtml): (Paragraph | Table)[] {
  if (no.tipo !== "elemento") return [];
  switch (no.tag) {
    case "p": {
      const tamanho = tamanhoMeioPontos(no.estilo);
      const fonte = nomeFonte(no.estilo);
      const runs = coletarRuns(no.filhos, {}, tamanho, fonte);
      return [
        new Paragraph({
          alignment: alinhamentoDoEstilo(no.estilo),
          indent: indentacaoDoEstilo(no.estilo),
          children: runs.length > 0 ? runs : [new TextRun("")],
        }),
      ];
    }
    case "ul":
    case "ol":
      return converterLista(no);
    case "table":
      return [converterTabela(no)];
    default:
      return [];
  }
}

// Converte o corpo_html (já sanitizado) num array de blocos docx, na
// ordem em que aparecem — usar como `children` de uma Document section,
// junto com qualquer cabeçalho/fechamento/assinatura específico do módulo.
//
// Limitação conhecida, sem efeito no uso atual (Suplementações nunca gera
// <table>, só <br> dentro de <p> — ver linhaItemHtml em
// suplementacoes/documento.ts): uma <table> ANINHADA dentro de uma <td>
// (padrão usado pelo caixaHtml de Licitações, ver documento-comum.ts) é
// silenciosamente ignorada por coletarRuns — só reconhece texto/br/negrito/
// itálico/sublinhado/span dentro de uma célula, não uma tabela aninhada.
// Se este conversor for reaproveitado pra Licitações no futuro, resolver
// isso primeiro (célula com tabela aninhada precisaria virar ela mesma uma
// sub-Table dentro do TableCell, não uma lista de TextRun).
export function converterHtmlParaDocx(htmlSanitizado: string): (Paragraph | Table)[] {
  return parseHtml(htmlSanitizado).flatMap(converterBloco);
}
