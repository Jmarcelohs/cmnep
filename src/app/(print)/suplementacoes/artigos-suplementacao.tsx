import type { ReactNode } from "react";
import { formatarMoeda } from "@/lib/pdf/formato";
import { numeroRomano, segmentosFicha, valorPorExtensoMinusculo } from "@/lib/suplementacoes/documento";
import type { DotacaoOrcamentaria } from "@/lib/suplementacoes/documento";
import {
  ALTURA_ART_INTRO_MM,
  ALTURA_ITEM_MM,
  ALTURA_TOTAL_GERAL_MM,
  type BlocoSuplementacao,
} from "@/lib/suplementacoes/paginacao";

export type ItemSuplementacao = {
  valor: number;
  dotacao: DotacaoOrcamentaria;
};

type BlocoConteudo = BlocoSuplementacao & { node: ReactNode };

// Um bloco "I / Ficha N / <7 linhas da classificação> / Total....R$X" —
// mesmo formato impresso num Ato/Decreto real (ver modelo de referência).
// A última linha da classificação (fonte de recurso) sai duas vezes: uma
// só com o código+nome, outra repetindo com o valor ao lado — reproduz
// literalmente o modelo real, não é duplicação por engano.
function BlocoItem({ item, indice }: { item: ItemSuplementacao; indice: number }) {
  const linhas = segmentosFicha(item.dotacao);
  const ultima = linhas[linhas.length - 1];

  return (
    <div className="mt-3 leading-none">
      <p>{numeroRomano(indice + 1)}</p>
      <p>Ficha {item.dotacao.ficha}</p>
      {linhas.map((l) => (
        <p key={l.codigo}>
          {l.codigo} {l.nome}
        </p>
      ))}
      <p>
        {ultima.codigo} {ultima.nome} {formatarMoeda(item.valor)}
      </p>
      <p className="mt-2 flex items-end gap-1">
        <span>Total</span>
        <span className="mb-0.5 flex-1 border-b border-dotted border-black" />
        <span>{formatarMoeda(item.valor)}</span>
      </p>
    </div>
  );
}

// Monta os blocos de um artigo (parágrafo introdutório + uma ficha por
// bloco + total geral, se houver mais de uma) já com a altura estimada de
// cada um — cada bloco é atômico pra paginarBlocosSuplementacao nunca
// quebrar uma ficha ao meio entre duas páginas.
function blocosDoArtigo(
  itens: ItemSuplementacao[],
  intro: ReactNode,
): BlocoConteudo[] {
  const totalGeral = itens.reduce((soma, i) => soma + i.valor, 0);

  const blocos: BlocoConteudo[] = [{ altura: ALTURA_ART_INTRO_MM, node: intro }];

  itens.forEach((item, i) => {
    blocos.push({
      altura: ALTURA_ITEM_MM,
      node: <BlocoItem key={item.dotacao.id} item={item} indice={i} />,
    });
  });

  if (itens.length > 1) {
    blocos.push({
      altura: ALTURA_TOTAL_GERAL_MM,
      node: (
        <p key="total-geral" className="mt-2 flex items-end gap-1 font-bold">
          <span>Total Geral</span>
          <span className="mb-0.5 flex-1 border-b border-dotted border-black" />
          <span>{formatarMoeda(totalGeral)}</span>
        </p>
      ),
    });
  }

  return blocos;
}

// Art.1º (destino — crédito suplementar), Art.2º (origem — anulação
// parcial) e Art.3º (vigência) — texto idêntico entre Ato e Decreto, só
// muda a palavra "ato"/"decreto" no Art.3º. Devolve os blocos já com altura
// estimada, pra quem monta a página (ato-mesa-diretora-conteudo.tsx /
// decreto-suplementacao-conteudo.tsx) paginar junto com título e fechamento.
export function montarBlocosArtigos({
  itensDestino,
  itensOrigem,
  substantivoDocumento,
}: {
  itensDestino: ItemSuplementacao[];
  itensOrigem: ItemSuplementacao[];
  substantivoDocumento: "ato" | "decreto";
}): BlocoConteudo[] {
  const valorTotal = itensDestino.reduce((soma, i) => soma + i.valor, 0);

  const blocosArt1 = blocosDoArtigo(
    itensDestino,
    <p key="art1-intro" className="indent-[1.25cm] text-justify">
      <strong>Art.1º</strong> Abrir crédito adicional do tipo suplementar no orçamento vigente da
      Câmara Municipal de Nepomuceno no valor total de {formatarMoeda(valorTotal)} (
      {valorPorExtensoMinusculo(valorTotal)}) sob as seguintes classificações orçamentárias:
    </p>,
  );

  const blocosArt2 = blocosDoArtigo(
    itensOrigem,
    <p key="art2-intro" className="mt-4 indent-[1.25cm] text-justify">
      <strong>Art.2º</strong> A origem dos recursos dos créditos suplementares autorizados no art. 1º
      que totaliza {formatarMoeda(valorTotal)} ({valorPorExtensoMinusculo(valorTotal)}) será a
      anulação parcial das seguintes dotações do Orçamento da Câmara Municipal de Nepomuceno:
    </p>,
  );

  const blocoArt3: BlocoConteudo = {
    altura: ALTURA_ART_INTRO_MM,
    node: (
      <p key="art3" className="mt-4 indent-[1.25cm] text-justify">
        <strong>Art.3º</strong> Este {substantivoDocumento} entra em vigor na data da sua publicação,
        revogando as disposições em contrário.
      </p>
    ),
  };

  return [...blocosArt1, ...blocosArt2, blocoArt3];
}
