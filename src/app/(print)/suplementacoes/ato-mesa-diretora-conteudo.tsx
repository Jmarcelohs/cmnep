import { PaginaA4 } from "../celula";
import { dataPorExtenso } from "@/lib/pdf/formato";
import { CIDADE, MESA_DIRETORA } from "@/lib/suplementacoes/documento";
import {
  ALTURA_TITULO_MM,
  ALTURA_FECHAMENTO_MM,
  ALTURA_ASSINATURA_MESA_MM,
  paginarBlocosSuplementacao,
} from "@/lib/suplementacoes/paginacao";
import { montarBlocosArtigos, type ItemSuplementacao } from "./artigos-suplementacao";

const TIMBRADO = "/timbrado/oficio-diretor-executivo.png";
// Margens medidas por comparação direta com um Ato real (12/05/2026):
// título centralizado a ~51mm do topo, ~30mm de cada lado (mesmo timbrado
// do Ofício do Diretor Executivo) — repetidas em toda página de conteúdo,
// não só na primeira, porque o timbrado real também se repete.
const MARGEM = "ml-[30mm] mr-[30mm] mt-[48mm] mb-[24mm]";

export function AtoMesaDiretoraConteudo({
  dataAto,
  itensDestino,
  itensOrigem,
}: {
  dataAto: string;
  itensDestino: ItemSuplementacao[];
  itensOrigem: ItemSuplementacao[];
}) {
  const tituloBloco = {
    altura: ALTURA_TITULO_MM,
    node: (
      <div key="titulo">
        <p className="text-center font-bold">
          ATO DA MESA DIRETORA DE {dataPorExtenso(dataAto).toUpperCase()}
        </p>
        <p className="mt-4 text-right font-bold">
          Abre crédito suplementar no Orçamento vigente da Câmara Municipal.
        </p>
        <p className="mt-4 text-justify">
          A Mesa Diretora da Câmara Municipal de Nepomuceno, conforme lhe faculta o art. 67, inciso VI
          da Lei Orgânica Municipal, por determinação do art. 42 da Lei Federal 4.320/64, RESOLVE:
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
          <strong>Art.3º</strong> Este ato entra em vigor na data da sua publicação, revogando as
          disposições em contrário.
        </p>
        <p className="mt-4 text-right">
          {CIDADE}, {dataPorExtenso(dataAto)}.
        </p>
      </div>
    ),
  };

  const assinaturaBloco = {
    altura: ALTURA_ASSINATURA_MESA_MM,
    node: (
      <div key="assinatura" className="mt-[16mm] flex flex-col items-center gap-[10mm]">
        <div className="text-center leading-none">
          <p className="font-bold uppercase">{MESA_DIRETORA.presidente.nome}</p>
          <p>{MESA_DIRETORA.presidente.cargo}</p>
          <p>{MESA_DIRETORA.bienio}</p>
        </div>
        <div className="flex w-full justify-around">
          <div className="text-center leading-none">
            <p className="font-bold uppercase">{MESA_DIRETORA.vicePresidente.nome}</p>
            <p>{MESA_DIRETORA.vicePresidente.cargo}</p>
            <p>{MESA_DIRETORA.bienio}</p>
          </div>
          <div className="text-center leading-none">
            <p className="font-bold uppercase">{MESA_DIRETORA.secretario.nome}</p>
            <p>{MESA_DIRETORA.secretario.cargo}</p>
            <p>{MESA_DIRETORA.bienio}</p>
          </div>
        </div>
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
