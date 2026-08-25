import { DocumentoPaginadoConteudo } from "./documento-paginado-conteudo";

export function DfdConteudo({ corpoHtml }: { corpoHtml: string }) {
  return <DocumentoPaginadoConteudo corpoHtml={corpoHtml} />;
}
