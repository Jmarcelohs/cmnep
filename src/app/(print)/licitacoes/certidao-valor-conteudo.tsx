import { DocumentoPaginadoConteudo } from "./documento-paginado-conteudo";

export function CertidaoValorConteudo({ corpoHtml }: { corpoHtml: string }) {
  return <DocumentoPaginadoConteudo corpoHtml={corpoHtml} />;
}
