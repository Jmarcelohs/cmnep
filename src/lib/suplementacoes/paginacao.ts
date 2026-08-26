import type { ReactNode } from "react";

// Paginação do Ato/Decreto de suplementação. O corpo (título, ementa,
// preâmbulo, Art.1º/2º/3º) agora é texto rico livre — editável antes de
// gerar o PDF (ver rich-text-editor.tsx) — então a paginação não pode mais
// contar com blocos de altura fixa conhecida de antemão: precisa dividir o
// HTML salvo em blocos de nível superior e ESTIMAR a altura de cada um.
//
// Mesmo raciocínio de paginarTextoCorrido em @/lib/pdf/paginacao: estima
// por cima (menos caracteres por linha do que o real) — melhor gerar uma
// página a mais do que arriscar estourar texto por cima do rodapé do
// timbrado (já aconteceu nesse mesmo módulo, ver commits anteriores).
export const ALTURA_UTIL_PAGINA_MM = 225; // 297mm - 48mm (topo) - 24mm (rodapé)

// Calibrado pro corpo do Ato/Decreto: 12pt, entrelinha 1,5 (regra oficial
// da Base de Formatação da Câmara), largura útil 160mm (ml-30mm mr-20mm
// num A4). CARACTERES_POR_LINHA menor que os 88 usados em
// @/lib/pdf/paginacao (que já é 160mm/1,5 — mas arredondado pra baixo
// aqui, mais linhas estimadas = mais seguro).
const CARACTERES_POR_LINHA = 82;
// 12pt × 1,5 de entrelinha ≈ 6,35mm/linha — arredondado por cima.
export const ALTURA_LINHA_MM = 6.6;
const TAMANHO_REFERENCIA_PT = 12;

// linhaItemHtml (ver suplementacoes/documento.ts) gera cada bloco de item
// em font-size:10pt, menor que os 12pt usados pra calibrar
// ALTURA_LINHA_MM/CARACTERES_POR_LINHA acima — sem escalar por isso, a
// altura de um bloco de 10pt era superestimada em ~25% (linha maior do que
// a real, e menos caracteres cabendo por linha do que cabe de verdade).
// Isso forçava quebras de página bem antes da hora, deixando cada página
// com uma sobra grande de espaço em branco e o Ato/Decreto espalhado por
// muito mais páginas do que precisava — o que lia como "espaçamento
// grande"/"cortado" (visto ao vivo: um Ato de 10 itens ocupando 6 páginas
// quase vazias em vez de ~3).
function tamanhoFontePt(html: string): number {
  const m = html.match(/font-size:\s*(\d+)pt/i);
  return m ? Number(m[1]) : TAMANHO_REFERENCIA_PT;
}
export const ALTURA_LINHA_TABELA_MM = 8;
export const MARGEM_ENTRE_BLOCOS_MM = 2;

export const ALTURA_FECHAMENTO_MM = 16; // só "Cidade, data por extenso."
// Presidente + Vice-Presidente/Secretário lado a lado (Ato: 3 signatários)
// — leading-normal (não leading-none) por pedido explícito de mais espaço
// entre as linhas de cada bloco de assinatura.
export const ALTURA_ASSINATURA_MESA_MM = 68;
// Só o Prefeito (Decreto: 1 signatário) — leading-normal, mesmo motivo do
// bloco do Ato (mais espaço entre nome e cargo).
export const ALTURA_ASSINATURA_PREFEITO_MM = 32;

export type BlocoSuplementacao = { altura: number };

// Blocos de nível superior que o sanitizador aceita (ver
// sanitizar-html.ts) — nenhum deles aninha outro do mesmo nível, então dá
// pra dividir com uma alternância simples, sem precisar de um parser HTML
// de verdade.
const REGEX_BLOCO_NIVEL_SUPERIOR = /<p[^>]*>[\s\S]*?<\/p>|<ul[^>]*>[\s\S]*?<\/ul>|<ol[^>]*>[\s\S]*?<\/ol>|<table[^>]*>[\s\S]*?<\/table>/gi;

export function dividirEmBlocosDeNivelSuperior(htmlSanitizado: string): string[] {
  return htmlSanitizado.match(REGEX_BLOCO_NIVEL_SUPERIOR) ?? [];
}

function textoPlano(html: string): string {
  return html.replace(/<[^>]+>/g, "").trim();
}

// Um <p> pode ter várias linhas "forçadas" com <br> (ex.: o bloco de uma
// ficha, uma linha por nível da classificação orçamentária) — cada uma
// conta separado, e dentro dela ainda pode quebrar por largura se for
// comprida. Ignorar os <br> e estimar só pelo total de caracteres
// subestimaria muito a altura de um bloco assim.
function estimarAlturaParagrafo(html: string): number {
  const fatorEscala = tamanhoFontePt(html) / TAMANHO_REFERENCIA_PT;
  const caracteresPorLinha = CARACTERES_POR_LINHA / fatorEscala;
  const alturaLinha = ALTURA_LINHA_MM * fatorEscala;

  const linhas = html.split(/<br\s*\/?>/i);
  let totalLinhas = 0;
  for (const linha of linhas) {
    const comprimento = textoPlano(linha).length;
    totalLinhas += comprimento === 0 ? 1 : Math.ceil(comprimento / caracteresPorLinha);
  }
  return totalLinhas * alturaLinha + MARGEM_ENTRE_BLOCOS_MM;
}

function estimarAlturaLista(html: string): number {
  const itens = html.match(/<li[^>]*>/gi)?.length ?? 1;
  return itens * ALTURA_LINHA_MM + MARGEM_ENTRE_BLOCOS_MM;
}

function estimarAlturaTabela(html: string): number {
  const linhas = html.match(/<tr[^>]*>/gi)?.length ?? 1;
  return linhas * ALTURA_LINHA_TABELA_MM + MARGEM_ENTRE_BLOCOS_MM;
}

export function estimarAlturaBlocoHtml(html: string): number {
  const aparado = html.trim();
  if (/^<table/i.test(aparado)) return estimarAlturaTabela(aparado);
  if (/^<(ul|ol)/i.test(aparado)) return estimarAlturaLista(aparado);
  return estimarAlturaParagrafo(aparado);
}

export type BlocoConteudo =
  | { altura: number; kind: "html"; html: string }
  | { altura: number; kind: "node"; node: ReactNode };

// Divide um HTML já sanitizado em blocos {altura, html} prontos pra entrar
// na mesma lista paginada dos blocos fixos (fechamento, assinatura).
export function blocosDeHtml(htmlSanitizado: string): BlocoConteudo[] {
  return dividirEmBlocosDeNivelSuperior(htmlSanitizado).map((html) => ({
    altura: estimarAlturaBlocoHtml(html),
    kind: "html",
    html,
  }));
}

export function paginarBlocosSuplementacao<T extends BlocoSuplementacao>(blocos: T[]): T[][] {
  const paginas: T[][] = [];
  let atual: T[] = [];
  let alturaAtual = 0;

  for (const bloco of blocos) {
    if (atual.length > 0 && alturaAtual + bloco.altura > ALTURA_UTIL_PAGINA_MM) {
      paginas.push(atual);
      atual = [];
      alturaAtual = 0;
    }
    atual.push(bloco);
    alturaAtual += bloco.altura;
  }

  if (atual.length > 0) paginas.push(atual);
  if (paginas.length === 0) paginas.push([]);
  return paginas;
}
