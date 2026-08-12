import { PaginaA4 } from "../celula";
import { dataPorExtenso } from "@/lib/pdf/formato";
import { sanitizarHtmlDocumento } from "@/lib/sanitizar-html";
import { CIDADE, MESA_DIRETORA, montarCorpoAtoPadrao, type ItemSuplementacao } from "@/lib/suplementacoes/documento";
import {
  ALTURA_FECHAMENTO_MM,
  ALTURA_ASSINATURA_MESA_MM,
  blocosDeHtml,
  paginarBlocosSuplementacao,
  type BlocoConteudo,
} from "@/lib/suplementacoes/paginacao";

const TIMBRADO = "/timbrado/oficio-diretor-executivo.png";
// Margem lateral (~30mm) medida direto num Ato real (12/05/2026), mesmo
// timbrado do Ofício do Diretor Executivo. Margem superior ajustada por
// pedido explícito (título mais próximo do cabeçalho do que os ~48mm
// originais) — repetida em toda página de conteúdo, não só na primeira,
// porque o timbrado real também se repete.
const MARGEM = "ml-[30mm] mr-[30mm] mt-[40mm] mb-[24mm]";

export function AtoMesaDiretoraConteudo({
  dataAto,
  corpoHtml,
  itensDestino,
  itensOrigem,
}: {
  dataAto: string;
  // Título/ementa/preâmbulo/Art.1º-2º-3º — texto rico editável (ver
  // rich-text-editor.tsx). null nos registros salvos antes da migration
  // 0048: remonta o texto padrão a partir das fichas, igual sempre foi.
  corpoHtml: string | null;
  itensDestino: ItemSuplementacao[];
  itensOrigem: ItemSuplementacao[];
}) {
  // Sanitiza de novo aqui (já sanitizado ao salvar) — roda dentro da
  // própria página que o Puppeteer abre pra gerar o PDF, vale a camada
  // extra de segurança direto no ponto de renderização (mesma convenção do
  // Ofício do Diretor Executivo — ver oficio-de-conteudo.tsx).
  const html = sanitizarHtmlDocumento(
    corpoHtml?.trim() || montarCorpoAtoPadrao({ dataAto, itensDestino, itensOrigem }),
  );

  const fechamentoBloco: BlocoConteudo = {
    altura: ALTURA_FECHAMENTO_MM,
    kind: "node",
    node: (
      <p key="fechamento" className="text-right">
        {CIDADE}, {dataPorExtenso(dataAto)}.
      </p>
    ),
  };

  const assinaturaBloco: BlocoConteudo = {
    altura: ALTURA_ASSINATURA_MESA_MM,
    kind: "node",
    node: (
      <div key="assinatura" className="mt-[16mm] flex flex-col items-center gap-[10mm]">
        <div className="text-center leading-normal">
          <p className="font-bold uppercase">{MESA_DIRETORA.presidente.nome}</p>
          <p>{MESA_DIRETORA.presidente.cargo}</p>
          <p>{MESA_DIRETORA.bienio}</p>
        </div>
        <div className="flex w-full justify-around">
          <div className="text-center leading-normal">
            <p className="font-bold uppercase">{MESA_DIRETORA.vicePresidente.nome}</p>
            <p>{MESA_DIRETORA.vicePresidente.cargo}</p>
            <p>{MESA_DIRETORA.bienio}</p>
          </div>
          <div className="text-center leading-normal">
            <p className="font-bold uppercase">{MESA_DIRETORA.secretario.nome}</p>
            <p>{MESA_DIRETORA.secretario.cargo}</p>
            <p>{MESA_DIRETORA.bienio}</p>
          </div>
        </div>
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
