import { Fragment } from "react";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../../../print-button";
import { AnexoIConteudo } from "../../../anexo-i-conteudo";
import { AnexoIIConteudo } from "../../../anexo-ii-conteudo";
import { RequerimentoConteudo } from "../../../../requerimentos/requerimento-conteudo";
import { ComprovantesConteudo } from "../../../../requerimentos/comprovantes-conteudo";
import { carregarAnexosParaImpressao, carregarAnexosReembolsoParaImpressao } from "@/lib/pdf/anexos";

export default async function ImprimirCompletoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: solicitacao } = await supabase
    .from("diarias_solicitacoes")
    .select("*, pessoas(matricula, nome, cargo, categoria)")
    .eq("id", id)
    .single();

  if (!solicitacao) notFound();

  const { data: itens } = await supabase
    .from("diarias_itens")
    .select("*")
    .eq("solicitacao_id", id);

  const { data: prestacao } = await supabase
    .from("diarias_prestacoes_contas")
    .select("*, pessoas(nome)")
    .eq("solicitacao_id", id)
    .single();

  if (!prestacao) notFound();

  const { data: pagamentos } = await supabase
    .from("diarias_prestacoes_pagamentos")
    .select("*")
    .eq("prestacao_id", prestacao.id);

  const pessoaSolicitacao = solicitacao.pessoas as unknown as {
    matricula: string | null;
    nome: string;
    cargo: string;
    categoria: string;
  } | null;

  const pessoaPrestacao = prestacao.pessoas as unknown as { nome: string } | null;
  const { fotos, documentos } = await carregarAnexosParaImpressao(supabase, prestacao.id);

  // Requerimentos de reembolso vinculados a essa diária entram em seguida
  // no mesmo PDF, um por página.
  const { data: requerimentos } = await supabase
    .from("requerimentos_reembolso")
    .select("*, pessoas(nome)")
    .eq("solicitacao_diaria_id", id)
    .order("criado_em");

  const temRequerimentos = (requerimentos ?? []).length > 0;

  const requerimentosComAnexos = await Promise.all(
    (requerimentos ?? []).map(async (requerimento) => ({
      requerimento,
      ...(await carregarAnexosReembolsoParaImpressao(supabase, requerimento.id)),
    })),
  );

  return (
    <>
      <PrintButton
        url={`/api/diarias/${id}/prestacao-contas/pdf-completo`}
        nomeArquivoPadrao={`anexo-i-e-ii-${id}.pdf`}
      />
      <AnexoIConteudo
        solicitacao={solicitacao}
        itens={itens ?? []}
        pessoa={pessoaSolicitacao}
        quebrarPagina
      />
      <AnexoIIConteudo
        prestacao={prestacao}
        pagamentos={pagamentos ?? []}
        pessoa={pessoaPrestacao}
        fotos={fotos}
        documentos={documentos}
        ultimoDocumento={!temRequerimentos}
      />
      {requerimentosComAnexos.map(({ requerimento, fotos, documentos }, indice) => {
        const ultimoRequerimento = indice === requerimentosComAnexos.length - 1;
        const temAnexos = fotos.length > 0 || documentos.length > 0;
        return (
          <Fragment key={requerimento.id}>
            <RequerimentoConteudo
              requerimento={requerimento}
              pessoa={requerimento.pessoas as unknown as { nome: string } | null}
              cpf={requerimento.cpf}
              quebrarPagina={temAnexos || !ultimoRequerimento}
            />
            <ComprovantesConteudo
              fotos={fotos}
              documentos={documentos}
              ultimoDocumento={ultimoRequerimento}
            />
          </Fragment>
        );
      })}
    </>
  );
}
