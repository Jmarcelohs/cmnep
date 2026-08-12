import { PaginaA4 } from "../celula";
import { dataPorExtenso } from "@/lib/pdf/formato";
import { sanitizarHtmlDocumento } from "@/lib/sanitizar-html";
import {
  CIDADE,
  PREFEITO_CARGO,
  PREFEITO_NOME,
  montarCorpoDecretoPadrao,
  type ItemSuplementacao,
} from "@/lib/suplementacoes/documento";
import {
  ALTURA_FECHAMENTO_MM,
  ALTURA_ASSINATURA_PREFEITO_MM,
  blocosDeHtml,
  paginarBlocosSuplementacao,
  type BlocoConteudo,
} from "@/lib/suplementacoes/paginacao";

const TIMBRADO = "/timbrado/oficio-diretor-executivo.png";
// Margem superior ajustada por pedido explícito (título mais próximo do
// cabeçalho) — mesmo valor usado no Ato (ver ato-mesa-diretora-conteudo.tsx).
const MARGEM = "ml-[30mm] mr-[30mm] mt-[40mm] mb-[24mm]";

export function DecretoSuplementacaoConteudo({
  numeroDecreto,
  dataDecreto,
  corpoHtml,
  itensDestino,
  itensOrigem,
}: {
  numeroDecreto: string;
  dataDecreto: string;
  corpoHtml: string | null;
  itensDestino: ItemSuplementacao[];
  itensOrigem: ItemSuplementacao[];
}) {
  const html = sanitizarHtmlDocumento(
    corpoHtml?.trim() ||
      montarCorpoDecretoPadrao({ numeroDecreto, dataDecreto, itensDestino, itensOrigem }),
  );

  const fechamentoBloco: BlocoConteudo = {
    altura: ALTURA_FECHAMENTO_MM,
    kind: "node",
    node: (
      <p key="fechamento" className="text-right">
        Gabinete do Prefeito de {CIDADE}, {dataPorExtenso(dataDecreto)}.
      </p>
    ),
  };

  const assinaturaBloco: BlocoConteudo = {
    altura: ALTURA_ASSINATURA_PREFEITO_MM,
    kind: "node",
    node: (
      <div key="assinatura" className="mx-auto mt-[16mm] w-[100mm] text-center leading-none">
        <p className="font-bold uppercase">{PREFEITO_NOME}</p>
        <p>{PREFEITO_CARGO}</p>
      </div>
    ),
  };

  const paginas = paginarBlocosSuplementacao<BlocoConteudo>([
    ...blocosDeHtml(html),
    fechamentoBloco,
    assinaturaBloco,
  ]);

  return (
    <>
      {paginas.map((pagina, indice) => (
        <PaginaA4 key={indice} backgroundImage={TIMBRADO} quebrarPagina={indice < paginas.length - 1}>
          <div
            className={`${MARGEM} flex flex-1 flex-col gap-2 text-[12pt] leading-snug [&_ol]:list-decimal [&_ol]:pl-5 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-black [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-black [&_th]:px-2 [&_th]:py-1 [&_th]:font-bold [&_ul]:list-disc [&_ul]:pl-5`}
          >
            {pagina.map((bloco, i) =>
              bloco.kind === "node" ? (
                bloco.node
              ) : (
                <div key={i} dangerouslySetInnerHTML={{ __html: bloco.html }} />
              ),
            )}
          </div>
        </PaginaA4>
      ))}
    </>
  );
}
