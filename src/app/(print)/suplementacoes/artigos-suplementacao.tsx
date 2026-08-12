import { formatarMoeda } from "@/lib/pdf/formato";
import { numeroRomano, segmentosFicha, valorPorExtensoMinusculo } from "@/lib/suplementacoes/documento";
import type { DotacaoOrcamentaria } from "@/lib/suplementacoes/documento";

export type ItemSuplementacao = {
  valor: number;
  dotacao: DotacaoOrcamentaria;
};

// Um bloco "I / Ficha N / <7 linhas da classificação> / Total....R$X" —
// mesmo formato impresso num Ato/Decreto real (ver modelo de referência).
// A última linha da classificação (fonte de recurso) sai duas vezes: uma
// só com o código+nome, outra repetindo com o valor ao lado — reproduz
// literalmente o modelo real, não é duplicação por engano.
function BlocoItem({ item, indice }: { item: ItemSuplementacao; indice: number }) {
  const linhas = segmentosFicha(item.dotacao);
  const ultima = linhas[linhas.length - 1];

  return (
    <div className="mt-4 leading-none">
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

function BlocoArtigo({ itens }: { itens: ItemSuplementacao[] }) {
  const totalGeral = itens.reduce((soma, i) => soma + i.valor, 0);
  return (
    <>
      {itens.map((item, i) => (
        <BlocoItem key={item.dotacao.id} item={item} indice={i} />
      ))}
      {itens.length > 1 && (
        <p className="mt-2 flex items-end gap-1 font-bold">
          <span>Total Geral</span>
          <span className="mb-0.5 flex-1 border-b border-dotted border-black" />
          <span>{formatarMoeda(totalGeral)}</span>
        </p>
      )}
    </>
  );
}

// Art.1º (destino — crédito suplementar), Art.2º (origem — anulação
// parcial) e Art.3º (vigência) — texto idêntico entre Ato e Decreto, só
// muda a palavra "ato"/"decreto" no Art.3º.
export function ArtigosSuplementacao({
  itensDestino,
  itensOrigem,
  substantivoDocumento,
}: {
  itensDestino: ItemSuplementacao[];
  itensOrigem: ItemSuplementacao[];
  substantivoDocumento: "ato" | "decreto";
}) {
  const valorTotal = itensDestino.reduce((soma, i) => soma + i.valor, 0);

  return (
    <>
      <p className="mt-6 indent-[1.25cm] text-justify">
        <strong>Art.1º</strong> Abrir crédito adicional do tipo suplementar no orçamento vigente da
        Câmara Municipal de Nepomuceno no valor total de {formatarMoeda(valorTotal)} (
        {valorPorExtensoMinusculo(valorTotal)}) sob as seguintes classificações orçamentárias:
      </p>

      <BlocoArtigo itens={itensDestino} />

      <p className="mt-6 indent-[1.25cm] text-justify">
        <strong>Art.2º</strong> A origem dos recursos dos créditos suplementares autorizados no art.
        1º que totaliza {formatarMoeda(valorTotal)} ({valorPorExtensoMinusculo(valorTotal)}) será a
        anulação parcial das seguintes dotações do Orçamento da Câmara Municipal de Nepomuceno:
      </p>

      <BlocoArtigo itens={itensOrigem} />

      <p className="mt-6 indent-[1.25cm] text-justify">
        <strong>Art.3º</strong> Este {substantivoDocumento} entra em vigor na data da sua publicação,
        revogando as disposições em contrário.
      </p>
    </>
  );
}
