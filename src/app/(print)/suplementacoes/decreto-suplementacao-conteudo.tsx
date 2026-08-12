import { PaginaA4 } from "../celula";
import { dataPorExtenso } from "@/lib/pdf/formato";
import { CIDADE, PREFEITO_CARGO, PREFEITO_NOME } from "@/lib/suplementacoes/documento";
import { ALTURA_TITULO_MM, ALTURA_FECHAMENTO_MM, paginarBlocosSuplementacao } from "@/lib/suplementacoes/paginacao";
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

  const fechamentoBloco = {
    altura: ALTURA_FECHAMENTO_MM,
    node: (
      <p key="fechamento" className="mt-4">
        Gabinete do Prefeito de {CIDADE}, {dataPorExtenso(dataDecreto)}.
      </p>
    ),
  };

  const paginasConteudo = paginarBlocosSuplementacao([
    tituloBloco,
    ...montarBlocosArtigos({ itensDestino, itensOrigem, substantivoDocumento: "decreto" }),
    fechamentoBloco,
  ]);

  return (
    <>
      {paginasConteudo.map((pagina, indice) => (
        <PaginaA4 key={indice} backgroundImage={TIMBRADO}>
          <div className={`${MARGEM} flex flex-1 flex-col text-[12pt] leading-snug`}>
            {pagina.map((bloco) => bloco.node)}
          </div>
        </PaginaA4>
      ))}

      <PaginaA4 backgroundImage={TIMBRADO} quebrarPagina={false}>
        <div className={`${MARGEM} flex flex-1 flex-col text-[12pt]`}>
          <div className="mx-auto mt-[16mm] w-[100mm] text-center leading-none">
            <p className="font-bold uppercase">{PREFEITO_NOME}</p>
            <p>{PREFEITO_CARGO}</p>
          </div>
        </div>
      </PaginaA4>
    </>
  );
}
