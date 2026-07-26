import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../../print-button";
import { RequerimentoConteudo } from "../../requerimento-conteudo";
import { ComprovantesConteudo } from "../../comprovantes-conteudo";
import { carregarAnexosReembolsoParaImpressao } from "@/lib/pdf/anexos";

export default async function ImprimirReembolsoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: requerimento } = await supabase
    .from("requerimentos_reembolso")
    .select("*, pessoas(nome)")
    .eq("id", id)
    .single();

  if (!requerimento) notFound();

  const pessoa = requerimento.pessoas as unknown as { nome: string } | null;
  const { fotos, documentos } = await carregarAnexosReembolsoParaImpressao(supabase, id);
  const temAnexos = fotos.length > 0 || documentos.length > 0;

  return (
    <>
      <PrintButton
        url={`/api/requerimentos/${id}/pdf`}
        nomeArquivoPadrao={`requerimento-${requerimento.protocolo.replace("/", "-")}.pdf`}
      />
      <RequerimentoConteudo
        requerimento={requerimento}
        pessoa={pessoa}
        cpf={requerimento.cpf}
        quebrarPagina={temAnexos}
      />
      <ComprovantesConteudo fotos={fotos} documentos={documentos} />
    </>
  );
}
