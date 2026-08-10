import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../../print-button";
import { MocaoConteudo } from "../../mocao-conteudo";
import { buscarMocaoCompleta } from "@/lib/mocoes/dados-completos";

export default async function ImprimirMocaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const dados = await buscarMocaoCompleta(supabase, id);
  if (!dados) notFound();
  const { mocao, autor, associados, assinaturasPorId } = dados;

  const notaPapel =
    mocao.tipo === "congratulacoes"
      ? "Papel fotográfico glossy 230g, paisagem (A4 deitado)"
      : "Papel sulfite A4 90g, retrato";

  return (
    <>
      <div className="no-print fixed left-6 top-6 max-w-xs rounded-md bg-white px-3 py-2 text-xs text-slate-600 shadow-lg">
        Imprimir em: <strong>{notaPapel}</strong>
      </div>
      <PrintButton
        url={`/api/mocoes/${id}/pdf`}
        urlSecundaria={`/api/mocoes/${id}/docx`}
        nomeArquivoPadrao={`mocao-${id}.pdf`}
        nomeArquivoSecundarioPadrao={`mocao-${id}.docx`}
        rotuloSecundario="Baixar Word"
      />
      <MocaoConteudo mocao={mocao} autor={autor} associados={associados} assinaturasPorId={assinaturasPorId} />
    </>
  );
}
