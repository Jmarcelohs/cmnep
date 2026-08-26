import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buscarSuplementacaoCompleta } from "@/lib/suplementacoes/dados";
import { PrintButton } from "../../../../print-button";
import { AtoMesaDiretoraConteudo } from "../../../ato-mesa-diretora-conteudo";

export default async function ImprimirAtoPage({
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
        url={`/api/suplementacoes/${id}/ato/pdf`}
        nomeArquivoPadrao={`ato-mesa-diretora-${id}.pdf`}
        urlSecundaria={`/api/suplementacoes/${id}/ato/docx`}
        nomeArquivoSecundarioPadrao={`ato-mesa-diretora-${id}.docx`}
        rotuloSecundario="Baixar em Word"
      />
      <AtoMesaDiretoraConteudo
        dataAto={suplementacao.data_ato}
        corpoHtml={suplementacao.corpo_ato_html}
        itensDestino={itensDestino}
        itensOrigem={itensOrigem}
      />
    </>
  );
}
