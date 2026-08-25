import { PaginaA4 } from "../celula";
import { sanitizarHtmlDocumento } from "@/lib/sanitizar-html";
import { paginarTR } from "@/lib/licitacoes/paginar-tr";

const FONTE = "Arial, Helvetica, sans-serif";
const CONTEUDO_CLASSE =
  "ml-[20mm] mr-[20mm] mt-[42mm] mb-[35mm] text-[11pt] leading-[1.35] text-justify [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-black [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-black [&_th]:px-2 [&_th]:py-1 [&_th]:font-bold [&_th]:text-center [&_p]:mb-2";

// Uma <PaginaA4> por página calculada (ver paginarTR) — uma <PaginaA4> só
// com conteúdo que estoura os 297mm não empurra a próxima página pra
// baixo, só sobrepõe o timbrado dela (bug visto ao vivo). O TR é sempre
// longo (15 seções + tabelas), por isso precisa dessa divisão manual —
// só a primeira página calculada leva timbrado de verdade; as demais
// também (mesmo componente), diferente de Ofícios (que deixam a partir da
// 2ª em branco) porque aqui cada "página calculada" já É uma PaginaA4
// própria, não overflow de uma só.
export function TrConteudo({ corpoHtml }: { corpoHtml: string }) {
  const html = sanitizarHtmlDocumento(corpoHtml);
  const paginas = paginarTR(html);

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
