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

// Calibrado pro corpo do Ato/Decreto: 12pt, leading-snug (~1.375), largura
// útil 150mm (ml-30mm mr-30mm num A4). CARACTERES_POR_LINHA menor que os
// 88 usados em @/lib/pdf/paginacao (calibrado pra 160mm) — proporcional à
// largura menor, arredondado pra baixo (mais linhas estimadas = mais
// seguro).
const CARACTERES_POR_LINHA = 78;
export const ALTURA_LINHA_MM = 6.2;
export const ALTURA_LINHA_TABELA_MM = 8;
export const MARGEM_ENTRE_BLOCOS_MM = 2;

export const ALTURA_FECHAMENTO_MM = 16; // só "Cidade, data por extenso."
// Presidente + Vice-Presidente/Secretário lado a lado (Ato: 3 signatários)
// — leading-normal (não leading-none) por pedido explícito de mais espaço
// entre as linhas de cada bloco de assinatura.
export const ALTURA_ASSINATURA_MESA_MM = 68;
// Só o Prefeito (Decreto: 1 signatário).
export const ALTURA_ASSINATURA_PREFEITO_MM = 28;

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
  const linhas = html.split(/<br\s*\/?>/i);
  let totalLinhas = 0;
  for (const linha of linhas) {
    const comprimento = textoPlano(linha).length;
    totalLinhas += comprimento === 0 ? 1 : Math.ceil(comprimento / CARACTERES_POR_LINHA);
  }
  return totalLinhas * ALTURA_LINHA_MM + MARGEM_ENTRE_BLOCOS_MM;
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
