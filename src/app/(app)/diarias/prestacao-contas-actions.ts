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

export async function criarPrestacaoContas(
  solicitacaoId: string,
  proximaEtapa: string | null,
  formData: FormData,
) {
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
    const etapaQuery = proximaEtapa ? `&etapa=${proximaEtapa}` : "";
    redirect(
      `/diarias/${solicitacaoId}/prestacao-contas?error=${encodeURIComponent(mensagem)}${etapaQuery}`,
    );
  }

  revalidatePath(`/diarias/${solicitacaoId}`);
  revalidatePath(`/diarias/${solicitacaoId}/prestacao-contas`);
  redirect(
    proximaEtapa
      ? `/diarias/${solicitacaoId}/prestacao-contas?etapa=${proximaEtapa}`
      : `/diarias/${solicitacaoId}/prestacao-contas`,
  );
}

export async function editarPrestacaoContas(
  prestacaoId: string,
  solicitacaoId: string,
  proximaEtapa: string | null,
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
    const destino = proximaEtapa
      ? `/diarias/${solicitacaoId}/prestacao-contas?etapa=${proximaEtapa}`
      : `/diarias/${solicitacaoId}/prestacao-contas/editar`;
    redirect(`${destino}${destino.includes("?") ? "&" : "?"}error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/diarias/${solicitacaoId}`);
  revalidatePath(`/diarias/${solicitacaoId}/prestacao-contas`);
  revalidatePath("/diarias");
  redirect(
    proximaEtapa
      ? `/diarias/${solicitacaoId}/prestacao-contas?etapa=${proximaEtapa}`
      : `/diarias/${solicitacaoId}/prestacao-contas`,
  );
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

export type ResultadoLote = {
  aplicados: number;
  ignorados: { nome: string; motivo: string }[];
};

async function buscarMinhaPessoaId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  usuarioId: string,
) {
  const { data } = await supabase
    .from("pessoas")
    .select("id")
    .eq("usuario_id", usuarioId)
    .maybeSingle();
  return data?.id ?? null;
}

// Ações em lote chamadas diretamente do cliente (não via <form action>) —
// o resultado (quantos aplicados/ignorados) precisa voltar pra tela em vez
// de só redirecionar. Diferente das ações individuais acima, checam papel
// e estado no servidor (a UI que monta a lista de seleção já filtra tudo
// isso, mas nada impedia uma chamada direta antes — ver plano/contexto).
export async function aprovarPrestacoesEmLote(ids: string[]): Promise<ResultadoLote> {
  const usuario = await getCurrentUsuario();
  const supabase = await createClient();

  const papelPermitido =
    usuario?.papel === "ordenador_despesa" ||
    usuario?.papel === "admin" ||
    usuario?.papel === "gestor_diarias";
  if (!usuario || !papelPermitido || ids.length === 0) return { aplicados: 0, ignorados: [] };

  const minhaPessoa =
    usuario.papel === "gestor_diarias" ? await buscarMinhaPessoaId(supabase, usuario.id) : null;

  const { data: prestacoes } = await supabase
    .from("diarias_prestacoes_contas")
    .select("id, pessoa_id, data_autenticacao_beneficiario, data_aprovacao_ordenador, pessoas(nome)")
    .in("id", ids);

  const aplicaveis: string[] = [];
  const ignorados: { nome: string; motivo: string }[] = [];

  for (const p of prestacoes ?? []) {
    const nome = (p.pessoas as unknown as { nome: string } | null)?.nome ?? "—";
    if (minhaPessoa && p.pessoa_id === minhaPessoa) {
      ignorados.push({ nome, motivo: "é a sua própria prestação de contas" });
    } else if (!p.data_autenticacao_beneficiario) {
      ignorados.push({ nome, motivo: "ainda é rascunho" });
    } else if (p.data_aprovacao_ordenador) {
      ignorados.push({ nome, motivo: "já foi aprovada" });
    } else {
      aplicaveis.push(p.id);
    }
  }

  if (aplicaveis.length > 0) {
    await supabase
      .from("diarias_prestacoes_contas")
      .update({ data_aprovacao_ordenador: hoje() })
      .in("id", aplicaveis);
    revalidatePath("/dashboard");
  }

  return { aplicados: aplicaveis.length, ignorados };
}

export async function emitirPareceresEmLote(
  ids: string[],
  parecer: Parecer,
  parecer_observacao: string | null,
): Promise<ResultadoLote> {
  const usuario = await getCurrentUsuario();
  const supabase = await createClient();

  const papelPermitido =
    usuario?.papel === "controle_interno" ||
    usuario?.papel === "admin" ||
    usuario?.papel === "gestor_diarias";
  if (!usuario || !papelPermitido || ids.length === 0) return { aplicados: 0, ignorados: [] };

  const minhaPessoa =
    usuario.papel === "gestor_diarias" ? await buscarMinhaPessoaId(supabase, usuario.id) : null;

  const { data: prestacoes } = await supabase
    .from("diarias_prestacoes_contas")
    .select("id, pessoa_id, data_autenticacao_beneficiario, parecer, pessoas(nome)")
    .in("id", ids);

  const aplicaveis: string[] = [];
  const ignorados: { nome: string; motivo: string }[] = [];

  for (const p of prestacoes ?? []) {
    const nome = (p.pessoas as unknown as { nome: string } | null)?.nome ?? "—";
    if (minhaPessoa && p.pessoa_id === minhaPessoa) {
      ignorados.push({ nome, motivo: "é a sua própria prestação de contas" });
    } else if (!p.data_autenticacao_beneficiario) {
      ignorados.push({ nome, motivo: "ainda é rascunho" });
    } else if (p.parecer) {
      ignorados.push({ nome, motivo: "já tem parecer" });
    } else {
      aplicaveis.push(p.id);
    }
  }

  if (aplicaveis.length > 0) {
    await supabase
      .from("diarias_prestacoes_contas")
      .update({ parecer, parecer_observacao, parecer_data: hoje() })
      .in("id", aplicaveis);
    revalidatePath("/dashboard");
  }

  return { aplicados: aplicaveis.length, ignorados };
}
