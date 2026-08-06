"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { TESOUREIRO_PADRAO } from "@/lib/diarias/documento";
import type { Parecer } from "@/lib/supabase/database.types";

function numero(formData: FormData, campo: string) {
  const valor = formData.get(campo);
  return valor ? Number(valor) : 0;
}

const hoje = () => new Date().toISOString().slice(0, 10);

export async function criarPrestacaoContas(solicitacaoId: string, formData: FormData) {
  const usuario = await getCurrentUsuario();
  if (!usuario) redirect("/login");

  const supabase = await createClient();

  const { data: solicitacao } = await supabase
    .from("diarias_solicitacoes")
    .select(
      "pessoa_id, numero_solicitacao, fundamento_legal, data_solicitacao, data_partida, data_chegada",
    )
    .eq("id", solicitacaoId)
    .single();

  if (!solicitacao) {
    redirect(`/diarias/${solicitacaoId}?error=${encodeURIComponent("Solicitação não encontrada")}`);
  }

  const relatorio_resultado = String(formData.get("relatorio_resultado") ?? "");

  const debito_diarias_previstas = numero(formData, "debito_diarias_previstas");
  const debito_diarias_nao_previstas = numero(formData, "debito_diarias_nao_previstas");
  const debito_transporte_aereo = numero(formData, "debito_transporte_aereo");
  const debito_transporte_urbano = numero(formData, "debito_transporte_urbano");

  const credito_recebidas_antecipadamente = numero(formData, "credito_recebidas_antecipadamente");
  const credito_reembolsar = numero(formData, "credito_reembolsar");
  const credito_transporte_urbano = numero(formData, "credito_transporte_urbano");
  const credito_devolver = numero(formData, "credito_devolver");

  const total_debito =
    debito_diarias_previstas +
    debito_diarias_nao_previstas +
    debito_transporte_aereo +
    debito_transporte_urbano;
  const total_credito =
    credito_recebidas_antecipadamente +
    credito_reembolsar +
    credito_transporte_urbano +
    credito_devolver;

  const enviar = formData.get("_acao") === "enviar";

  const { data: prestacao, error } = await supabase
    .from("diarias_prestacoes_contas")
    .insert({
      solicitacao_id: solicitacaoId,
      pessoa_id: solicitacao!.pessoa_id,
      numero_solicitacao: solicitacao!.numero_solicitacao,
      fundamento_legal: solicitacao!.fundamento_legal,
      data_solicitacao: solicitacao!.data_solicitacao,
      data_partida: solicitacao!.data_partida,
      data_chegada: solicitacao!.data_chegada,
      relatorio_resultado,
      debito_diarias_previstas,
      debito_diarias_nao_previstas,
      debito_transporte_aereo,
      debito_transporte_urbano,
      credito_recebidas_antecipadamente,
      credito_reembolsar,
      credito_transporte_urbano,
      credito_devolver,
      total_debito,
      total_credito,
      data_autenticacao_beneficiario: enviar ? hoje() : null,
      criado_por: usuario.id,
    })
    .select("id")
    .single();

  if (error || !prestacao) {
    // Duplicate key = essa diária já tem prestação de contas (ex.: duplo
    // clique no envio) — a tela de prestação de contas já mostra a
    // existente ao recarregar.
    const mensagem = error?.message.includes("duplicate key")
      ? "Essa diária já tem uma prestação de contas registrada."
      : (error?.message ?? "Erro ao salvar a prestação de contas");
    redirect(`/diarias/${solicitacaoId}/prestacao-contas?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath(`/diarias/${solicitacaoId}`);
  revalidatePath(`/diarias/${solicitacaoId}/prestacao-contas`);
  redirect(`/diarias/${solicitacaoId}/prestacao-contas`);
}

export async function editarPrestacaoContas(
  prestacaoId: string,
  solicitacaoId: string,
  formData: FormData,
) {
  const usuario = await getCurrentUsuario();
  if (!usuario) redirect("/login");

  const supabase = await createClient();

  const relatorio_resultado = String(formData.get("relatorio_resultado") ?? "");

  const debito_diarias_previstas = numero(formData, "debito_diarias_previstas");
  const debito_diarias_nao_previstas = numero(formData, "debito_diarias_nao_previstas");
  const debito_transporte_aereo = numero(formData, "debito_transporte_aereo");
  const debito_transporte_urbano = numero(formData, "debito_transporte_urbano");

  const credito_recebidas_antecipadamente = numero(formData, "credito_recebidas_antecipadamente");
  const credito_reembolsar = numero(formData, "credito_reembolsar");
  const credito_transporte_urbano = numero(formData, "credito_transporte_urbano");
  const credito_devolver = numero(formData, "credito_devolver");

  const total_debito =
    debito_diarias_previstas +
    debito_diarias_nao_previstas +
    debito_transporte_aereo +
    debito_transporte_urbano;
  const total_credito =
    credito_recebidas_antecipadamente +
    credito_reembolsar +
    credito_transporte_urbano +
    credito_devolver;

  const enviar = formData.get("_acao") === "enviar";

  const { error } = await supabase
    .from("diarias_prestacoes_contas")
    .update({
      relatorio_resultado,
      debito_diarias_previstas,
      debito_diarias_nao_previstas,
      debito_transporte_aereo,
      debito_transporte_urbano,
      credito_recebidas_antecipadamente,
      credito_reembolsar,
      credito_transporte_urbano,
      credito_devolver,
      total_debito,
      total_credito,
      ...(enviar ? { data_autenticacao_beneficiario: hoje() } : {}),
    })
    .eq("id", prestacaoId);

  if (error) {
    redirect(
      `/diarias/${solicitacaoId}/prestacao-contas/editar?error=${encodeURIComponent(error.message)}`,
    );
  }

  revalidatePath(`/diarias/${solicitacaoId}`);
  revalidatePath(`/diarias/${solicitacaoId}/prestacao-contas`);
  revalidatePath("/diarias");
  redirect(`/diarias/${solicitacaoId}/prestacao-contas`);
}

// Formaliza um rascunho já preenchido sem precisar reabrir o formulário —
// mesmo efeito de editar e clicar "Enviar prestação de contas".
export async function enviarPrestacaoContas(prestacaoId: string, solicitacaoId: string) {
  const supabase = await createClient();
  await supabase
    .from("diarias_prestacoes_contas")
    .update({ data_autenticacao_beneficiario: hoje() })
    .eq("id", prestacaoId);

  revalidatePath(`/diarias/${solicitacaoId}`);
  revalidatePath(`/diarias/${solicitacaoId}/prestacao-contas`);
  revalidatePath("/diarias");
}

export async function excluirPrestacaoContas(prestacaoId: string, solicitacaoId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("diarias_prestacoes_contas")
    .delete()
    .eq("id", prestacaoId);

  revalidatePath(`/diarias/${solicitacaoId}`);
  revalidatePath("/diarias");

  if (error) {
    redirect(
      `/diarias/${solicitacaoId}/prestacao-contas?error=${encodeURIComponent("Não foi possível excluir: " + error.message)}`,
    );
  }

  redirect(`/diarias/${solicitacaoId}`);
}

export async function aprovarPrestacaoOrdenador(prestacaoId: string, solicitacaoId: string) {
  const supabase = await createClient();
  await supabase
    .from("diarias_prestacoes_contas")
    .update({ data_aprovacao_ordenador: hoje() })
    .eq("id", prestacaoId);

  revalidatePath(`/diarias/${solicitacaoId}/prestacao-contas`);
}

export async function darBaixaPagamento(
  prestacaoId: string,
  solicitacaoId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  const numeroProcesso = String(formData.get("numero_processo") ?? "");
  const valor = Number(formData.get("valor") ?? 0);

  if (numeroProcesso && valor) {
    await supabase.from("diarias_prestacoes_pagamentos").insert({
      prestacao_id: prestacaoId,
      numero_processo: numeroProcesso,
      valor,
    });
  }

  await supabase
    .from("diarias_prestacoes_contas")
    .update({ tesoureiro_nome: TESOUREIRO_PADRAO, data_baixa: hoje() })
    .eq("id", prestacaoId);

  revalidatePath(`/diarias/${solicitacaoId}/prestacao-contas`);
}

export async function emitirParecerControleInterno(
  prestacaoId: string,
  solicitacaoId: string,
  formData: FormData,
) {
  const supabase = await createClient();

  const parecer = String(formData.get("parecer") ?? "") as Parecer;
  const parecer_observacao = String(formData.get("parecer_observacao") ?? "") || null;

  await supabase
    .from("diarias_prestacoes_contas")
    .update({
      parecer,
      parecer_observacao,
      parecer_data: hoje(),
    })
    .eq("id", prestacaoId);

  revalidatePath(`/diarias/${solicitacaoId}/prestacao-contas`);
}
