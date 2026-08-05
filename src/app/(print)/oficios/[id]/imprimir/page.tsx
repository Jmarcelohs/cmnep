import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../../print-button";
import { OficioConteudo } from "../../oficio-conteudo";

export default async function ImprimirOficioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: oficio } = await supabase.from("oficios").select("*").eq("id", id).single();

  if (!oficio) notFound();

  return (
    <>
      <PrintButton
        url={`/api/oficios/${id}/pdf`}
        nomeArquivoPadrao={`oficio-${oficio.numero}-${oficio.ano}.pdf`}
      />
      <OficioConteudo oficio={oficio} />
    </>
  );
}
