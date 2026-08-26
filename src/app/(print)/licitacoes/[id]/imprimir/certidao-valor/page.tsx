import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../../../print-button";
import { CertidaoValorConteudo } from "../../../certidao-valor-conteudo";

export default async function ImprimirCertidaoValorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: documento } = await supabase
    .from("processos_licitatorios_documentos")
    .select("corpo_html")
    .eq("processo_id", id)
    .eq("tipo", "certidao_valor")
    .single();
  if (!documento) notFound();

  return (
    <>
      <PrintButton
        url={`/api/licitacoes/${id}/certidao-valor/pdf`}
        nomeArquivoPadrao={`certidao-de-valor-${id}.pdf`}
      />
      <CertidaoValorConteudo corpoHtml={documento.corpo_html} />
    </>
  );
}
