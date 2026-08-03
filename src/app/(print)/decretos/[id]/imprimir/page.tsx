import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../../print-button";
import { DecretoConteudo } from "../../decreto-conteudo";

export default async function ImprimirDecretoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: decreto } = await supabase
    .from("decretos_titulo_honorario")
    .select("*")
    .eq("id", id)
    .single();

  if (!decreto) notFound();

  let fotoUrl: string | null = null;
  if (decreto.foto_caminho) {
    const { data } = await supabase.storage
      .from("decretos-fotos")
      .createSignedUrl(decreto.foto_caminho, 300);
    fotoUrl = data?.signedUrl ?? null;
  }

  return (
    <>
      <PrintButton
        url={`/api/decretos/${id}/pdf`}
        nomeArquivoPadrao={`decreto-titulo-honorario-${decreto.numero}-${decreto.ano}.pdf`}
      />
      <DecretoConteudo decreto={decreto} fotoUrl={fotoUrl} />
    </>
  );
}
