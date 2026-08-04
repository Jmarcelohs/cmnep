"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { proximoNumero } from "@/lib/numeracao";

async function exigirOrdenadorOuAdmin(redirectPath: string) {
  const usuario = await getCurrentUsuario();
  if (
    usuario?.papel !== "admin" &&
    usuario?.papel !== "ordenador_despesa" &&
    usuario?.papel !== "gestor_diarias"
  ) {
    redirect(redirectPath);
  }
  return usuario;
}

function lerCampos(formData: FormData) {
  const numeroManual = String(formData.get("numero") ?? "").trim();
  const data_pedido = String(formData.get("data_pedido") ?? "");
  const processo = String(formData.get("processo") ?? "").trim();
  const locadora = String(formData.get("locadora") ?? "").trim();

  const pessoa_solicitante_id = String(formData.get("pessoa_solicitante_id") ?? "") || null;
  const solicitante_nome = String(formData.get("solicitante_nome") ?? "").trim();
  const solicitante_matricula = String(formData.get("solicitante_matricula") ?? "").trim() || null;
  const solicitante_cargo = String(formData.get("solicitante_cargo") ?? "").trim() || null;

  const pessoa_condutor_id = String(formData.get("pessoa_condutor_id") ?? "") || null;
  const condutor_nome = String(formData.get("condutor_nome") ?? "").trim();
  const condutor_matricula = String(formData.get("condutor_matricula") ?? "").trim() || null;
  const condutor_cargo = String(formData.get("condutor_cargo") ?? "").trim() || null;

  const item_id = String(formData.get("item_id") ?? "") || null;
  const veiculo_descricao = String(formData.get("veiculo_descricao") ?? "").trim();
  const valor_diaria = Number(formData.get("valor_diaria") ?? 0);
  const qtd_diarias = Number(formData.get("qtd_diarias") ?? 1);

  const data_retirada = String(formData.get("data_retirada") ?? "");
  const hora_retirada = String(formData.get("hora_retirada") ?? "") || null;
  const local_retirada = String(formData.get("local_retirada") ?? "").trim() || null;

  const data_devolucao = String(formData.get("data_devolucao") ?? "");
  const hora_devolucao = String(formData.get("hora_devolucao") ?? "") || null;
  const local_devolucao = String(formData.get("local_devolucao") ?? "").trim() || null;

  const observacoes = String(formData.get("observacoes") ?? "").trim() || null;

  return {
    numeroManual,
    data_pedido,
    processo,
    locadora,
    pessoa_solicitante_id,
    solicitante_nome,
    solicitante_matricula,
    solicitante_cargo,
    pessoa_condutor_id,
    condutor_nome,
    condutor_matricula,
    condutor_cargo,
    item_id,
    veiculo_descricao,
    valor_diaria,
    qtd_diarias,
    data_retirada,
    hora_retirada,
    local_retirada,
    data_devolucao,
    hora_devolucao,
    local_devolucao,
    observacoes,
  };
}

export async function criarLocacao(formData: FormData) {
  const usuario = await exigirOrdenadorOuAdmin("/veiculos");

  const campos = lerCampos(formData);

  if (
    !campos.solicitante_nome ||
    !campos.condutor_nome ||
    !campos.veiculo_descricao ||
    !campos.data_retirada ||
    !campos.data_devolucao
  ) {
    redirect(`/veiculos/novo?error=${encodeURIComponent("Preencha todos os campos obrigatórios")}`);
  }

  const ano = new Date(campos.data_pedido).getFullYear();
  const supabase = await createClient();

  let numero = campos.numeroManual;
  if (!numero) {
    // Sugestão = maior número já usado nesse ano + 1. Se ainda não existe
    // nenhum registro do ano, começa do 1 — exceto 2026, que continua a
    // numeração manual por e-mail que a Câmara já praticava antes da
    // ferramenta existir, então o primeiro sugerido é 52.
    const { data: doAno } = await supabase
      .from("veiculos_locacao_solicitacoes")
      .select("numero")
      .eq("ano", ano);

    const proximo = proximoNumero(
      (doAno ?? []).map((r) => r.numero),
      ano === 2026 ? 52 : 1,
    );
    numero = String(proximo).padStart(3, "0");
  }

  const valor_total = campos.valor_diaria * campos.qtd_diarias;

  const { data: locacao, error } = await supabase
    .from("veiculos_locacao_solicitacoes")
    .insert({
      numero,
      ano,
      data_pedido: campos.data_pedido,
      processo: campos.processo || "PRC011 - Pregão 003/2026",
      locadora: campos.locadora || "LOCAMAR LTDA",
      pessoa_solicitante_id: campos.pessoa_solicitante_id,
      solicitante_nome: campos.solicitante_nome,
      solicitante_matricula: campos.solicitante_matricula,
      solicitante_cargo: campos.solicitante_cargo,
      pessoa_condutor_id: campos.pessoa_condutor_id,
      condutor_nome: campos.condutor_nome,
      condutor_matricula: campos.condutor_matricula,
      condutor_cargo: campos.condutor_cargo,
      item_id: campos.item_id,
      veiculo_descricao: campos.veiculo_descricao,
      valor_diaria: campos.valor_diaria,
      qtd_diarias: campos.qtd_diarias,
      valor_total,
      data_retirada: campos.data_retirada,
      hora_retirada: campos.hora_retirada,
      local_retirada: campos.local_retirada,
      data_devolucao: campos.data_devolucao,
      hora_devolucao: campos.hora_devolucao,
      local_devolucao: campos.local_devolucao,
      observacoes: campos.observacoes,
      criado_por: usuario!.id,
    })
    .select("id")
    .single();

  if (error || !locacao) {
    const mensagem = error?.message.includes("duplicate key")
      ? `Já existe uma solicitação com o número "${numero}" em ${ano}. Escolha outro número.`
      : (error?.message ?? "Erro ao salvar a solicitação");
    redirect(`/veiculos/novo?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath("/veiculos");
  redirect("/veiculos");
}

export async function editarLocacao(id: string, formData: FormData) {
  await exigirOrdenadorOuAdmin(`/veiculos/${id}/editar`);

  const campos = lerCampos(formData);

  if (!campos.numeroManual) {
    redirect(`/veiculos/${id}/editar?error=${encodeURIComponent("Informe o número")}`);
  }

  const ano = new Date(campos.data_pedido).getFullYear();
  const valor_total = campos.valor_diaria * campos.qtd_diarias;

  const supabase = await createClient();
  const { error } = await supabase
    .from("veiculos_locacao_solicitacoes")
    .update({
      numero: campos.numeroManual,
      ano,
      data_pedido: campos.data_pedido,
      processo: campos.processo,
      locadora: campos.locadora,
      pessoa_solicitante_id: campos.pessoa_solicitante_id,
      solicitante_nome: campos.solicitante_nome,
      solicitante_matricula: campos.solicitante_matricula,
      solicitante_cargo: campos.solicitante_cargo,
      pessoa_condutor_id: campos.pessoa_condutor_id,
      condutor_nome: campos.condutor_nome,
      condutor_matricula: campos.condutor_matricula,
      condutor_cargo: campos.condutor_cargo,
      item_id: campos.item_id,
      veiculo_descricao: campos.veiculo_descricao,
      valor_diaria: campos.valor_diaria,
      qtd_diarias: campos.qtd_diarias,
      valor_total,
      data_retirada: campos.data_retirada,
      hora_retirada: campos.hora_retirada,
      local_retirada: campos.local_retirada,
      data_devolucao: campos.data_devolucao,
      hora_devolucao: campos.hora_devolucao,
      local_devolucao: campos.local_devolucao,
      observacoes: campos.observacoes,
    })
    .eq("id", id);

  if (error) {
    const mensagem = error.message.includes("duplicate key")
      ? `Já existe uma solicitação com esse número em ${ano}. Escolha outro número.`
      : error.message;
    redirect(`/veiculos/${id}/editar?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath("/veiculos");
  revalidatePath(`/veiculos/${id}/editar`);
  redirect("/veiculos");
}

export async function excluirLocacao(id: string) {
  await exigirOrdenadorOuAdmin("/veiculos");

  const supabase = await createClient();
  const { error } = await supabase.from("veiculos_locacao_solicitacoes").delete().eq("id", id);

  revalidatePath("/veiculos");

  if (error) {
    redirect(`/veiculos?error=${encodeURIComponent("Não foi possível excluir: " + error.message)}`);
  }

  redirect("/veiculos");
}
