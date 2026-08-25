import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../../../print-button";
import { SolicitacaoCompraConteudo } from "../../../solicitacao-compra-conteudo";
import type { ItemProcesso, PessoaResumo } from "@/lib/licitacoes/tipos";

export default async function ImprimirSolicitacaoCompraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: processo } = await supabase
    .from("processos_licitatorios")
    .select("objeto, data_abertura, pesquisa_precos_pessoa_id")
    .eq("id", id)
    .single();
  if (!processo) notFound();

  const [{ data: solicitacao }, { data: tr }, { data: itens }] = await Promise.all([
    supabase
      .from("processos_licitatorios_documentos")
      .select("corpo_html")
      .eq("processo_id", id)
      .eq("tipo", "solicitacao_compra")
      .single(),
    supabase
      .from("processos_licitatorios_documentos")
      .select("corpo_html")
      .eq("processo_id", id)
      .eq("tipo", "tr")
      .single(),
    supabase
      .from("processos_licitatorios_itens")
      .select("*")
      .eq("processo_id", id)
      .order("numero_item"),
  ]);
  if (!solicitacao) notFound();

  const { data: destinatario } = processo.pesquisa_precos_pessoa_id
    ? await supabase
        .from("pessoas")
        .select("id, nome, cargo, genero")
        .eq("id", processo.pesquisa_precos_pessoa_id)
        .single()
    : { data: null as PessoaResumo | null };

  const itensProcesso: ItemProcesso[] = (itens ?? []).map((i) => ({
    id: i.id,
    processoId: i.processo_id,
    numeroItem: i.numero_item,
    objeto: i.objeto,
    unidade: i.unidade,
    quantidade: Number(i.quantidade),
    valorUnitario: i.valor_unitario != null ? Number(i.valor_unitario) : null,
    valorGlobal: i.valor_global != null ? Number(i.valor_global) : null,
  }));

  return (
    <>
      <PrintButton
        url={`/api/licitacoes/${id}/solicitacao-compra/pdf`}
        nomeArquivoPadrao={`solicitacao-de-compra-${id}.pdf`}
      />
      <SolicitacaoCompraConteudo
        destinatario={destinatario}
        corpoHtml={solicitacao.corpo_html}
        itens={itensProcesso}
        objeto={processo.objeto}
        dataAbertura={processo.data_abertura}
        trCorpoHtml={tr?.corpo_html ?? ""}
      />
    </>
  );
}
