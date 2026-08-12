import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarSuplementacaoCompleta } from "@/lib/suplementacoes/dados";
import { PrintButton } from "../../../../print-button";
import { DecretoSuplementacaoConteudo } from "../../../decreto-suplementacao-conteudo";

export default async function ImprimirDecretoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const dados = await buscarSuplementacaoCompleta(supabase, id);
  if (!dados) notFound();
  const { suplementacao, itensDestino, itensOrigem } = dados;

  return (
    <>
      <PrintButton
        url={`/api/suplementacoes/${id}/decreto/pdf`}
        nomeArquivoPadrao={`decreto-suplementacao-${id}.pdf`}
      />
      <DecretoSuplementacaoConteudo
        numeroDecreto={suplementacao.numero_decreto || "___"}
        dataDecreto={suplementacao.data_decreto || suplementacao.data_ato}
        itensDestino={itensDestino}
        itensOrigem={itensOrigem}
      />
    </>
  );
}
