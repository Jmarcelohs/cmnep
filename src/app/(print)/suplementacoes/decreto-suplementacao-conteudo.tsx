import { PaginaA4 } from "../celula";
import { dataPorExtenso } from "@/lib/pdf/formato";
import { CIDADE, PREFEITO_CARGO, PREFEITO_NOME } from "@/lib/suplementacoes/documento";
import { ArtigosSuplementacao, type ItemSuplementacao } from "./artigos-suplementacao";

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
  return (
    <PaginaA4 backgroundImage="/timbrado/oficio-diretor-executivo.png">
      <div className="ml-[30mm] mr-[30mm] mt-[48mm] mb-[24mm] flex flex-1 flex-col text-[12pt] leading-relaxed">
        <p className="text-center font-bold">
          DECRETO Nº {numeroDecreto} DE {dataPorExtenso(dataDecreto).toUpperCase()}
        </p>

        <p className="mt-6 text-right font-bold">
          Abre crédito adicional suplementar no Orçamento vigente da Câmara Municipal
        </p>

        <p className="mt-6 text-justify">
          O Prefeito Municipal de Nepomuceno, no uso de suas atribuições legais e ratificando ato da
          mesa diretora da Câmara Municipal, DECRETA:
        </p>

        <ArtigosSuplementacao
          itensDestino={itensDestino}
          itensOrigem={itensOrigem}
          substantivoDocumento="decreto"
        />

        <p className="mt-8">
          Gabinete do Prefeito de {CIDADE}, {dataPorExtenso(dataDecreto)}.
        </p>

        <div className="mx-auto mt-[16mm] w-[100mm] text-center leading-none">
          <p className="font-bold uppercase">{PREFEITO_NOME}</p>
          <p>{PREFEITO_CARGO}</p>
        </div>
      </div>
    </PaginaA4>
  );
}
