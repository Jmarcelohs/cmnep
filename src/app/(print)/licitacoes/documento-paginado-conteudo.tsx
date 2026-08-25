import { PaginaA4 } from "../celula";
import { sanitizarHtmlDocumento } from "@/lib/sanitizar-html";
import { paginarBlocosHtml } from "@/lib/licitacoes/paginar-blocos-html";

const FONTE = "Arial, Helvetica, sans-serif";
const CONTEUDO_CLASSE =
  "ml-[20mm] mr-[20mm] mt-[42mm] mb-[35mm] text-[11pt] leading-[1.35] text-justify [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-black [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-black [&_th]:px-2 [&_th]:py-1 [&_th]:font-bold [&_th]:text-center [&_p]:mb-2";

// Renderiza um corpo_html editável (parágrafos + tabelas) dividido em
// quantas <PaginaA4> forem necessárias — ver paginarBlocosHtml pra saber
// por que uma <PaginaA4> só, com conteúdo que estoura os 297mm, não é
// suficiente (sobrepõe visualmente o timbrado da página seguinte). Usado
// pelo TR e pelo DFD — mesmo timbrado/margens/fonte, conteúdo que pode
// crescer além de uma página.
export function DocumentoPaginadoConteudo({ corpoHtml }: { corpoHtml: string }) {
  const html = sanitizarHtmlDocumento(corpoHtml);
  const paginas = paginarBlocosHtml(html);

  return (
    <>
      {paginas.map((paginaHtml, i) => (
        <PaginaA4 key={i} backgroundImage="/timbrado/licitacoes.jpg">
          <div className={CONTEUDO_CLASSE} style={{ fontFamily: FONTE }} dangerouslySetInnerHTML={{ __html: paginaHtml }} />
        </PaginaA4>
      ))}
    </>
  );
}
