import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTemplate } from "@/lib/avaliacoes/templates";
import { PrintButton } from "../../../print-button";
import { AvaliacaoConteudo } from "../../avaliacao-conteudo";

export default async function ImprimirAvaliacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: avaliacao } = await supabase
    .from("avaliacoes")
    .select(
      "ano, periodo, template, data_avaliacao, em_estagio_probatorio, avaliadores, itens, pontos_melhorar, pontos_positivos, pessoas(nome, matricula)",
    )
    .eq("id", id)
    .single();

  if (!avaliacao) notFound();

  const pessoa = avaliacao.pessoas as unknown as { nome: string; matricula: string | null } | null;

  return (
    <>
      <PrintButton
        url={`/api/avaliacoes/${id}/pdf`}
        nomeArquivoPadrao={`avaliacao-${pessoa?.nome ?? id}-${avaliacao.periodo}-${avaliacao.ano}.pdf`}
      />
      <AvaliacaoConteudo
        avaliacao={{
          pessoa: pessoa ?? { nome: "—", matricula: null },
          ano: avaliacao.ano,
          periodo: avaliacao.periodo,
          data_avaliacao: avaliacao.data_avaliacao,
          em_estagio_probatorio: avaliacao.em_estagio_probatorio,
          avaliadores: avaliacao.avaliadores,
          itens: avaliacao.itens,
          pontos_melhorar: avaliacao.pontos_melhorar,
          pontos_positivos: avaliacao.pontos_positivos,
        }}
        template={getTemplate(avaliacao.template)}
      />
    </>
  );
}
