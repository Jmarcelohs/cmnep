import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../../../print-button";
import { EtpConteudo } from "../../../etp-conteudo";

export default async function ImprimirEtpPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: documento } = await supabase
    .from("processos_licitatorios_documentos")
    .select("corpo_html")
    .eq("processo_id", id)
    .eq("tipo", "etp")
    .single();
  if (!documento) notFound();

  return (
    <>
      <PrintButton url={`/api/licitacoes/${id}/etp/pdf`} nomeArquivoPadrao={`etp-${id}.pdf`} />
      <EtpConteudo corpoHtml={documento.corpo_html} />
    </>
  );
}
