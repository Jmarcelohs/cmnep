// Paginação dos blocos itemizados do Ato/Decreto de suplementação. Cada
// bloco (parágrafo de artigo, ficha, total geral) é atômico — nunca quebra
// no meio — e o bloco de assinatura fica sempre isolado na página seguinte
// à parte (ver ato-mesa-diretora-conteudo.tsx), igual ao padrão já usado em
// decreto-conteudo.tsx pra separar texto de justificativa do bloco final.
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
// Só a linha "Cidade, data por extenso." — o Art.3º entra como um bloco de
// artigo comum (ALTURA_ART_INTRO_MM) e a assinatura fica numa página à
// parte, fora dessa paginação (ver ato-mesa-diretora-conteudo.tsx).
export const ALTURA_FECHAMENTO_MM = 16;

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
