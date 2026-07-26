"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { apenasDigitos } from "@/lib/reembolso/mascaras";
import type { CargoDeclarado, SubassuntoReembolso } from "@/lib/supabase/database.types";

const hoje = () => new Date().toISOString().slice(0, 10);

export async function criarReembolso(formData: FormData) {
  const usuario = await getCurrentUsuario();
  if (!usuario) redirect("/login");

  const protocolo = String(formData.get("protocolo") ?? "").trim();
  const pessoa_id = String(formData.get("pessoa_id") ?? "");
  const cargo_declarado = String(formData.get("cargo_declarado") ?? "") as CargoDeclarado;
  const cpf = apenasDigitos(String(formData.get("cpf") ?? "")) || null;
  const subassunto = String(formData.get("subassunto") ?? "") as SubassuntoReembolso;
  const data_requerimento = String(formData.get("data_requerimento") ?? "") || null;
  const data_ida = String(formData.get("data_ida") ?? "") || null;
  const data_volta = String(formData.get("data_volta") ?? "") || null;
  const municipio = String(formData.get("municipio") ?? "").trim();
  const valor = Number(formData.get("valor") ?? 0);
  const solicitacao_diaria_id = String(formData.get("solicitacao_diaria_id") ?? "") || null;
  const solicitacao_veiculo_id = String(formData.get("solicitacao_veiculo_id") ?? "") || null;
  const placa_veiculo = String(formData.get("placa_veiculo") ?? "").trim().toUpperCase() || null;
  const modelo_veiculo = String(formData.get("modelo_veiculo") ?? "").trim() || null;

  if (
    !protocolo ||
    !pessoa_id ||
    !cargo_declarado ||
    !subassunto ||
    !data_requerimento ||
    !data_ida ||
    !data_volta ||
    !municipio ||
    !valor
  ) {
    redirect(
      `/requerimentos/novo?error=${encodeURIComponent("Preencha todos os campos obrigatórios")}`,
    );
  }

  // Combustível/estacionamento precisa identificar o veículo usado.
  if (subassunto === "combustivel" && (!placa_veiculo || !modelo_veiculo)) {
    redirect(
      `/requerimentos/novo?error=${encodeURIComponent("Informe a placa e o modelo do veículo")}`,
    );
  }

  const supabase = await createClient();

  const { data: requerimento, error } = await supabase
    .from("requerimentos_reembolso")
    .insert({
      protocolo,
      pessoa_id,
      cargo_declarado,
      cpf,
      data_requerimento,
      subassunto,
      data_ida,
      data_volta,
      municipio,
      valor,
      solicitacao_diaria_id,
      solicitacao_veiculo_id,
      placa_veiculo,
      modelo_veiculo,
      criado_por: usuario.id,
    })
    .select("id")
    .single();

  if (error || !requerimento) {
    // Violação do "unique" de protocolo é o caso mais comum aqui, já que
    // agora dá pra digitar o número manualmente.
    const mensagem = error?.message.includes("duplicate key")
      ? `Já existe um requerimento com o protocolo "${protocolo}". Escolha outro número.`
      : (error?.message ?? "Erro ao salvar o requerimento");
    redirect(`/requerimentos/novo?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath("/requerimentos");
  redirect(`/requerimentos/${requerimento!.id}`);
}

export async function editarReembolso(id: string, formData: FormData) {
  const supabase = await createClient();

  const protocolo = String(formData.get("protocolo") ?? "").trim();
  const cargo_declarado = String(formData.get("cargo_declarado") ?? "") as CargoDeclarado;
  const cpf = apenasDigitos(String(formData.get("cpf") ?? "")) || null;
  const subassunto = String(formData.get("subassunto") ?? "") as SubassuntoReembolso;
  const data_requerimento = String(formData.get("data_requerimento") ?? "") || null;
  const data_ida = String(formData.get("data_ida") ?? "");
  const data_volta = String(formData.get("data_volta") ?? "");
  const municipio = String(formData.get("municipio") ?? "").trim();
  const valor = Number(formData.get("valor") ?? 0);
  const solicitacao_diaria_id = String(formData.get("solicitacao_diaria_id") ?? "") || null;
  const solicitacao_veiculo_id = String(formData.get("solicitacao_veiculo_id") ?? "") || null;
  const placa_veiculo = String(formData.get("placa_veiculo") ?? "").trim().toUpperCase() || null;
  const modelo_veiculo = String(formData.get("modelo_veiculo") ?? "").trim() || null;

  if (!protocolo || !data_requerimento) {
    redirect(`/requerimentos/${id}/editar?error=${encodeURIComponent("Informe o protocolo e a data do requerimento")}`);
  }

  if (subassunto === "combustivel" && (!placa_veiculo || !modelo_veiculo)) {
    redirect(
      `/requerimentos/${id}/editar?error=${encodeURIComponent("Informe a placa e o modelo do veículo")}`,
    );
  }

  const { error } = await supabase
    .from("requerimentos_reembolso")
    .update({
      protocolo,
      cargo_declarado,
      cpf,
      subassunto,
      data_requerimento,
      data_ida,
      data_volta,
      municipio,
      valor,
      solicitacao_diaria_id,
      solicitacao_veiculo_id,
      placa_veiculo,
      modelo_veiculo,
    })
    .eq("id", id);

  if (error) {
    // Violação do "unique" de protocolo é o caso mais comum de erro aqui.
    const mensagem = error.message.includes("duplicate key")
      ? `Já existe um requerimento com o protocolo "${protocolo}". Escolha outro número.`
      : error.message;
    redirect(`/requerimentos/${id}/editar?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath(`/requerimentos/${id}`);
  revalidatePath("/requerimentos");
  redirect(`/requerimentos/${id}`);
}

export async function excluirReembolso(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("requerimentos_reembolso").delete().eq("id", id);

  revalidatePath("/requerimentos");

  if (error) {
    redirect(`/requerimentos?error=${encodeURIComponent("Não foi possível excluir: " + error.message)}`);
  }

  redirect("/requerimentos");
}

export async function marcarEmAnaliseReembolso(id: string) {
  const supabase = await createClient();
  await supabase.from("requerimentos_reembolso").update({ status: "analise" }).eq("id", id);
  revalidatePath(`/requerimentos/${id}`);
  revalidatePath("/requerimentos");
}

export async function autorizarReembolso(id: string) {
  const supabase = await createClient();
  await supabase
    .from("requerimentos_reembolso")
    .update({ status: "deferido", decisao: "autorizado", decisao_data: hoje() })
    .eq("id", id);
  revalidatePath(`/requerimentos/${id}`);
  revalidatePath("/requerimentos");
}

export async function naoAutorizarReembolso(id: string) {
  const supabase = await createClient();
  await supabase
    .from("requerimentos_reembolso")
    .update({ status: "indeferido", decisao: "nao_autorizado", decisao_data: hoje() })
    .eq("id", id);
  revalidatePath(`/requerimentos/${id}`);
  revalidatePath("/requerimentos");
}
