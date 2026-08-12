// Paginação dos blocos itemizados do Ato/Decreto de suplementação. Cada
// bloco (parágrafo de artigo, ficha, total geral, fechamento, assinatura)
// é atômico — nunca quebra no meio — e todos entram na MESMA lista
// paginada (título...assinatura), sem reservar de antemão uma página só
// pra assinatura: isso fazia sobrar uma página quase vazia toda vez que o
// Art.3º/fechamento não cabia no fim da página de itens, deixando a
// assinatura visualmente longe demais do texto (ver ato-mesa-diretora-
// conteudo.tsx). Deixando o pacote decidir onde cada bloco cai, a
// assinatura só fica numa página própria quando realmente não há espaço
// sobrando — igual ao Ato/Decreto reais.
//
// Alturas estimadas por cima (character-per-line real seria menor) — mesmo
// raciocínio de paginarTextoCorrido em @/lib/pdf/paginacao: melhor gerar
// uma página a mais do que arriscar estourar texto por cima do rodapé do
// timbrado (aconteceu num teste com só 1 ficha por artigo, ver commit).
export const ALTURA_UTIL_PAGINA_MM = 225; // 297mm - 48mm (topo) - 24mm (rodapé)

export const ALTURA_TITULO_MM = 44;
export const ALTURA_ART_INTRO_MM = 28;
export const ALTURA_ITEM_MM = 52;
export const ALTURA_TOTAL_GERAL_MM = 10;
// Art.3º + "Cidade, data por extenso." juntos num bloco só, pra nunca
// ficarem separados em páginas diferentes (um sem o outro não faz sentido
// visualmente, e nenhum dos dois isolado justificaria uma página própria).
export const ALTURA_FECHAMENTO_MM = 42;
// Presidente + Vice-Presidente/Secretário lado a lado (Ato: 3 signatários).
export const ALTURA_ASSINATURA_MESA_MM = 55;
// Só o Prefeito (Decreto: 1 signatário).
export const ALTURA_ASSINATURA_PREFEITO_MM = 28;

export type BlocoSuplementacao = { altura: number };

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
