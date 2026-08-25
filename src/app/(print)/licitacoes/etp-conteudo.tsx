import { DocumentoPaginadoConteudo } from "./documento-paginado-conteudo";
import { AnexoIConteudo } from "./solicitacao-compra-conteudo";

// Anexo I é o mesmo checklist fixo já usado na Solicitação de Compra —
// reaproveitado, não reescrito.
export function EtpConteudo({ corpoHtml }: { corpoHtml: string }) {
  return (
    <>
      <DocumentoPaginadoConteudo corpoHtml={corpoHtml} />
      <AnexoIConteudo />
    </>
  );
}
