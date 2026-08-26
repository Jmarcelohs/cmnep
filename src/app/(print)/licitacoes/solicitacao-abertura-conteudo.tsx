import { DocumentoPaginadoConteudo } from "./documento-paginado-conteudo";

export function SolicitacaoAberturaConteudo({ corpoHtml }: { corpoHtml: string }) {
  return <DocumentoPaginadoConteudo corpoHtml={corpoHtml} />;
}
