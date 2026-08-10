import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../../print-button";
import { MocaoConteudo } from "../../mocao-conteudo";

export default async function ImprimirMocaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: mocao } = await supabase.from("mocoes").select("*").eq("id", id).single();

  if (!mocao) notFound();

  return (
    <>
      <PrintButton url={`/api/mocoes/${id}/pdf`} nomeArquivoPadrao={`mocao-${id}.pdf`} />
      <MocaoConteudo mocao={mocao} />
    </>
  );
}
