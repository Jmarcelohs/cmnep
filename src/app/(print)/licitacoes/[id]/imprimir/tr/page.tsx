import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../../../print-button";
import { TrConteudo } from "../../../tr-conteudo";

export default async function ImprimirTrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: documento } = await supabase
    .from("processos_licitatorios_documentos")
    .select("corpo_html")
    .eq("processo_id", id)
    .eq("tipo", "tr")
    .single();
  if (!documento) notFound();

  return (
    <>
      <PrintButton url={`/api/licitacoes/${id}/tr/pdf`} nomeArquivoPadrao={`termo-de-referencia-${id}.pdf`} />
      <TrConteudo corpoHtml={documento.corpo_html} />
    </>
  );
}
