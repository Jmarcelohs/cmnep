import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../../../print-button";
import { SolicitacaoAberturaConteudo } from "../../../solicitacao-abertura-conteudo";

export default async function ImprimirSolicitacaoAberturaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: documento } = await supabase
    .from("processos_licitatorios_documentos")
    .select("corpo_html")
    .eq("processo_id", id)
    .eq("tipo", "solicitacao_abertura")
    .single();
  if (!documento) notFound();

  return (
    <>
      <PrintButton
        url={`/api/licitacoes/${id}/solicitacao-abertura/pdf`}
        nomeArquivoPadrao={`solicitacao-de-abertura-${id}.pdf`}
      />
      <SolicitacaoAberturaConteudo corpoHtml={documento.corpo_html} />
    </>
  );
}
