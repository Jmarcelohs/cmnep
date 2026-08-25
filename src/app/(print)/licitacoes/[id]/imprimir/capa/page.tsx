import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../../../print-button";
import { CapaConteudo } from "../../../capa-conteudo";
import type { PessoaResumo } from "@/lib/licitacoes/tipos";

export default async function ImprimirCapaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: processo } = await supabase
    .from("processos_licitatorios")
    .select("*, ficha:dotacoes_orcamentarias(*)")
    .eq("id", id)
    .single();
  if (!processo) notFound();

  const { data: documento } = await supabase
    .from("processos_licitatorios_documentos")
    .select("corpo_html")
    .eq("processo_id", id)
    .eq("tipo", "capa")
    .single();

  const idsPessoas = [processo.organizador_pessoa_id, processo.agente_contratacao_pessoa_id].filter(
    (v): v is string => Boolean(v),
  );
  const { data: pessoas } = idsPessoas.length
    ? await supabase.from("pessoas").select("id, nome, cargo, genero").in("id", idsPessoas)
    : { data: [] as PessoaResumo[] };
  const porId = new Map((pessoas ?? []).map((p) => [p.id, p as PessoaResumo]));

  return (
    <>
      <PrintButton
        url={`/api/licitacoes/${id}/capa/pdf`}
        nomeArquivoPadrao={`capa-do-processo-${id}.pdf`}
      />
      <CapaConteudo
        processo={{
          numeroProcesso: processo.numero_processo,
          ano: processo.ano,
          modalidade: processo.modalidade,
          numeroModalidade: processo.numero_modalidade,
          dataAbertura: processo.data_abertura,
          objeto: processo.objeto,
          dotacaoSubelemento: processo.dotacao_subelemento,
          vinculoPca: processo.vinculo_pca,
        }}
        ficha={processo.ficha}
        organizador={processo.organizador_pessoa_id ? (porId.get(processo.organizador_pessoa_id) ?? null) : null}
        corpoHtml={documento?.corpo_html ?? ""}
      />
    </>
  );
}
