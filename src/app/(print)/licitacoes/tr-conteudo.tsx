import { DocumentoPaginadoConteudo } from "./documento-paginado-conteudo";
import { AnexoIConteudo } from "./solicitacao-compra-conteudo";

// Anexo I é o mesmo checklist fixo já usado na Solicitação de Compra e no
// ETP — reaproveitado, não reescrito. O TR autônomo (fora da Solicitação
// de Compra) também traz esse anexo como última seção.
export function TrConteudo({ corpoHtml }: { corpoHtml: string }) {
  return (
    <>
      <DocumentoPaginadoConteudo corpoHtml={corpoHtml} />
      <AnexoIConteudo />
    </>
  );
}
