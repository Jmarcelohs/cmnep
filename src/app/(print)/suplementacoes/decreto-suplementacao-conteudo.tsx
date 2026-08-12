import { PaginaA4 } from "../celula";
import { dataPorExtenso } from "@/lib/pdf/formato";
import { CIDADE, PREFEITO_CARGO, PREFEITO_NOME } from "@/lib/suplementacoes/documento";
import {
  ALTURA_TITULO_MM,
  ALTURA_FECHAMENTO_MM,
  ALTURA_ASSINATURA_PREFEITO_MM,
  paginarBlocosSuplementacao,
} from "@/lib/suplementacoes/paginacao";
import { montarBlocosArtigos, type ItemSuplementacao } from "./artigos-suplementacao";

const TIMBRADO = "/timbrado/oficio-diretor-executivo.png";
const MARGEM = "ml-[30mm] mr-[30mm] mt-[48mm] mb-[24mm]";

export function DecretoSuplementacaoConteudo({
  numeroDecreto,
  dataDecreto,
  itensDestino,
  itensOrigem,
}: {
  numeroDecreto: string;
  dataDecreto: string;
  itensDestino: ItemSuplementacao[];
  itensOrigem: ItemSuplementacao[];
}) {
  const tituloBloco = {
    altura: ALTURA_TITULO_MM,
    node: (
      <div key="titulo">
        <p className="text-center font-bold">
          DECRETO Nº {numeroDecreto} DE {dataPorExtenso(dataDecreto).toUpperCase()}
        </p>
        <p className="mt-4 text-right font-bold">
          Abre crédito adicional suplementar no Orçamento vigente da Câmara Municipal
        </p>
        <p className="mt-4 text-justify">
          O Prefeito Municipal de Nepomuceno, no uso de suas atribuições legais e ratificando ato da
          mesa diretora da Câmara Municipal, DECRETA:
        </p>
      </div>
    ),
  };

  // Art.3º e a data de fechamento entram juntos, num bloco só — nunca faz
  // sentido um sem o outro na mesma página (ver ALTURA_FECHAMENTO_MM).
  const fechamentoBloco = {
    altura: ALTURA_FECHAMENTO_MM,
    node: (
      <div key="fechamento">
        <p className="mt-4 indent-[1.25cm] text-justify">
          <strong>Art.3º</strong> Este decreto entra em vigor na data da sua publicação, revogando as
          disposições em contrário.
        </p>
        <p className="mt-4">
          Gabinete do Prefeito de {CIDADE}, {dataPorExtenso(dataDecreto)}.
        </p>
      </div>
    ),
  };

  const assinaturaBloco = {
    altura: ALTURA_ASSINATURA_PREFEITO_MM,
    node: (
      <div key="assinatura" className="mx-auto mt-[16mm] w-[100mm] text-center leading-none">
        <p className="font-bold uppercase">{PREFEITO_NOME}</p>
        <p>{PREFEITO_CARGO}</p>
      </div>
    ),
  };

  const paginas = paginarBlocosSuplementacao([
    tituloBloco,
    ...montarBlocosArtigos({ itensDestino, itensOrigem }),
    fechamentoBloco,
    assinaturaBloco,
  ]);

  return (
    <>
      {paginas.map((pagina, indice) => (
        <PaginaA4 key={indice} backgroundImage={TIMBRADO} quebrarPagina={indice < paginas.length - 1}>
          <div className={`${MARGEM} flex flex-1 flex-col text-[12pt] leading-snug`}>
            {pagina.map((bloco) => bloco.node)}
          </div>
        </PaginaA4>
      ))}
    </>
  );
}
