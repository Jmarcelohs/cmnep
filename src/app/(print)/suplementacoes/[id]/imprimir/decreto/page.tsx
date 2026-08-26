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
        urlSecundaria={`/api/suplementacoes/${id}/decreto/docx`}
        nomeArquivoSecundarioPadrao={`decreto-suplementacao-${id}.docx`}
        rotuloSecundario="Baixar em Word"
      />
      <DecretoSuplementacaoConteudo
        numeroDecreto={suplementacao.numero_decreto || "___"}
        dataDecreto={suplementacao.data_decreto || suplementacao.data_ato}
        corpoHtml={suplementacao.corpo_decreto_html}
        itensDestino={itensDestino}
        itensOrigem={itensOrigem}
      />
    </>
  );
}
