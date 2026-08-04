"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { calcularTotalItens } from "@/lib/diarias/calculo";
import type { Categoria, ModoItemDiaria, TipoDiaria } from "@/lib/supabase/database.types";

type ItemInput = {
  modo: ModoItemDiaria;
  categoria?: Categoria;
  tipo?: TipoDiaria;
  faixa?: string;
  descricao_manual?: string;
  quantidade: number;
  valor_unitario: number;
};

export async function criarSolicitacao(formData: FormData) {
  const usuario = await getCurrentUsuario();
  if (!usuario) redirect("/login");

  const pessoa_id = String(formData.get("pessoa_id") ?? "");
  const numero_diaria = String(formData.get("numero_diaria") ?? "") || null;
  const numero_solicitacao = String(formData.get("numero_solicitacao") ?? "") || null;
  const municipio_destino = String(formData.get("municipio_destino") ?? "");
  const uf_destino = String(formData.get("uf_destino") ?? "") || null;
  const instituicao_destino = String(formData.get("instituicao_destino") ?? "");
  const contato_destino = String(formData.get("contato_destino") ?? "");
  const finalidade = String(formData.get("finalidade") ?? "");
  const data_partida = String(formData.get("data_partida") ?? "") || null;
  const data_chegada = String(formData.get("data_chegada") ?? "") || null;
  const data_solicitacao = String(formData.get("data_solicitacao") ?? "") || null;
  const itens: ItemInput[] = JSON.parse(String(formData.get("itens") ?? "[]"));

  if (!pessoa_id || !data_solicitacao || itens.length === 0) {
    redirect("/diarias/nova?error=Preencha+o+solicitante,+a+data+da+solicitação+e+ao+menos+um+item");
  }

  const supabase = await createClient();

  const total = calcularTotalItens(itens);

  const { data: solicitacao, error } = await supabase
    .from("diarias_solicitacoes")
    .insert({
      pessoa_id,
      numero_diaria,
      numero_solicitacao,
      municipio_destino,
      uf_destino,
      instituicao_destino,
      contato_destino,
      finalidade,
      data_partida,
      data_chegada,
      data_solicitacao,
      total,
      criado_por: usuario?.id,
    })
    .select("id")
    .single();

  if (error || !solicitacao) {
    redirect(`/diarias/nova?error=${encodeURIComponent(error?.message ?? "Erro ao criar solicitação")}`);
  }

  const { error: itensError } = await supabase.from("diarias_itens").insert(
    itens.map((item) => ({
      solicitacao_id: solicitacao!.id,
      modo: item.modo,
      categoria: item.categoria || null,
      tipo: item.tipo || null,
      faixa: item.faixa || null,
      descricao_manual: item.descricao_manual || null,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
    })),
  );

  if (itensError) {
    redirect(`/diarias/nova?error=${encodeURIComponent(itensError.message)}`);
  }

  revalidatePath("/diarias");
  redirect(`/diarias/${solicitacao!.id}`);
}

export async function editarSolicitacao(id: string, formData: FormData) {
  const usuario = await getCurrentUsuario();
  if (!usuario) redirect("/login");

  const numero_diaria = String(formData.get("numero_diaria") ?? "") || null;
  const numero_solicitacao = String(formData.get("numero_solicitacao") ?? "") || null;
  const municipio_destino = String(formData.get("municipio_destino") ?? "");
  const uf_destino = String(formData.get("uf_destino") ?? "") || null;
  const instituicao_destino = String(formData.get("instituicao_destino") ?? "");
  const contato_destino = String(formData.get("contato_destino") ?? "");
  const finalidade = String(formData.get("finalidade") ?? "");
  const data_partida = String(formData.get("data_partida") ?? "") || null;
  const data_chegada = String(formData.get("data_chegada") ?? "") || null;
  const data_solicitacao = String(formData.get("data_solicitacao") ?? "") || null;
  const data_autorizacao = String(formData.get("data_autorizacao") ?? "") || null;
  const itens: ItemInput[] = JSON.parse(String(formData.get("itens") ?? "[]"));

  if (!data_solicitacao || itens.length === 0) {
    redirect(`/diarias/${id}/editar?error=Preencha+a+data+da+solicitação+e+inclua+ao+menos+um+item`);
  }

  const supabase = await createClient();

  const total = calcularTotalItens(itens);

  const { error } = await supabase
    .from("diarias_solicitacoes")
    .update({
      numero_diaria,
      numero_solicitacao,
      municipio_destino,
      uf_destino,
      instituicao_destino,
      contato_destino,
      finalidade,
      data_partida,
      data_chegada,
      data_solicitacao,
      data_autorizacao,
      total,
    })
    .eq("id", id);

  if (error) {
    redirect(`/diarias/${id}/editar?error=${encodeURIComponent(error.message)}`);
  }

  const { error: deleteError } = await supabase
    .from("diarias_itens")
    .delete()
    .eq("solicitacao_id", id);

  if (deleteError) {
    redirect(`/diarias/${id}/editar?error=${encodeURIComponent(deleteError.message)}`);
  }

  const { error: itensError } = await supabase.from("diarias_itens").insert(
    itens.map((item) => ({
      solicitacao_id: id,
      modo: item.modo,
      categoria: item.categoria || null,
      tipo: item.tipo || null,
      faixa: item.faixa || null,
      descricao_manual: item.descricao_manual || null,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
    })),
  );

  if (itensError) {
    redirect(`/diarias/${id}/editar?error=${encodeURIComponent(itensError.message)}`);
  }

  revalidatePath(`/diarias/${id}`);
  revalidatePath("/diarias");
  redirect(`/diarias/${id}`);
}

export async function excluirSolicitacao(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("diarias_solicitacoes").delete().eq("id", id);

  revalidatePath("/diarias");

  if (error) {
    redirect(`/diarias?error=${encodeURIComponent("Não foi possível excluir: " + error.message)}`);
  }

  redirect("/diarias");
}

export async function autorizarSolicitacao(id: string, formData: FormData) {
  const data_autorizacao = String(formData.get("data_autorizacao") ?? "") || null;

  if (!data_autorizacao) {
    redirect(`/diarias/${id}?error=${encodeURIComponent("Informe a data de autorização")}`);
  }

  const supabase = await createClient();
  await supabase
    .from("diarias_solicitacoes")
    .update({
      status: "Autorizado",
      data_autorizacao,
    })
    .eq("id", id);

  revalidatePath(`/diarias/${id}`);
  revalidatePath("/diarias");
}

export async function indeferirSolicitacao(id: string) {
  const supabase = await createClient();
  await supabase
    .from("diarias_solicitacoes")
    .update({ status: "Indeferido" })
    .eq("id", id);

  revalidatePath(`/diarias/${id}`);
  revalidatePath("/diarias");
}
