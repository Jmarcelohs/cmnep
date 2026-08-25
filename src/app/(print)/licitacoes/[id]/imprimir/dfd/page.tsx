import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../../../print-button";
import { DfdConteudo } from "../../../dfd-conteudo";

export default async function ImprimirDfdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: documento } = await supabase
    .from("processos_licitatorios_documentos")
    .select("corpo_html")
    .eq("processo_id", id)
    .eq("tipo", "dfd")
    .single();
  if (!documento) notFound();

  return (
    <>
      <PrintButton url={`/api/licitacoes/${id}/dfd/pdf`} nomeArquivoPadrao={`dfd-${id}.pdf`} />
      <DfdConteudo corpoHtml={documento.corpo_html} />
    </>
  );
}
