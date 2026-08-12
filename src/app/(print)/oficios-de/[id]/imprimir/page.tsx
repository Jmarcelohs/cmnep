import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../../print-button";
import { OficioDEConteudo } from "../../oficio-de-conteudo";

export default async function ImprimirOficioDEPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: oficio } = await supabase
    .from("oficios_diretor_executivo")
    .select("*")
    .eq("id", id)
    .single();

  if (!oficio) notFound();

  return (
    <>
      <PrintButton
        url={`/api/oficios-de/${id}/pdf`}
        nomeArquivoPadrao={`oficio-de-${oficio.numero}-${oficio.ano}.pdf`}
      />
      <OficioDEConteudo oficio={oficio} />
    </>
  );
}
