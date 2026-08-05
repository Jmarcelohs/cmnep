"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { PARAGRAFO_FECHAMENTO_PADRAO } from "@/lib/oficios/documento";
import type { GeneroVereador, TipoOficio, TratamentoOficio } from "@/lib/supabase/database.types";

async function exigirPodeCriar(redirectPath: string) {
  const usuario = await getCurrentUsuario();
  if (
    usuario?.papel !== "admin" &&
    usuario?.papel !== "ordenador_despesa" &&
    usuario?.papel !== "servidor"
  ) {
    redirect(redirectPath);
  }
  return usuario;
}

async function exigirPodeGerenciar(redirectPath: string) {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin" && usuario?.papel !== "ordenador_despesa") {
    redirect(redirectPath);
  }
  return usuario;
}

function lerCampos(formData: FormData) {
  const tipo = String(formData.get("tipo") ?? "padrao") as TipoOficio;
  const numero = String(formData.get("numero") ?? "").trim();
  const data_oficio = String(formData.get("data_oficio") ?? "");
  const destinatario_tratamento = String(
    formData.get("destinatario_tratamento") ?? "Excelentíssimo Senhor",
  ) as TratamentoOficio;
  const destinatario_nome = String(formData.get("destinatario_nome") ?? "").trim();
  const destinatario_cargo = String(formData.get("destinatario_cargo") ?? "").trim();
  const destinatario_cidade_uf =
    String(formData.get("destinatario_cidade_uf") ?? "").trim() || null;
  const saudacao = String(formData.get("saudacao") ?? "").trim();
  const assunto = String(formData.get("assunto") ?? "").trim();
  const autor_nome = String(formData.get("autor_nome") ?? "").trim() || null;
  const autor_genero = (String(formData.get("autor_genero") ?? "Vereador") ||
    null) as GeneroVereador | null;
  const autor_associado_nome =
    String(formData.get("autor_associado_nome") ?? "").trim() || null;
  const autor_associado_genero = (String(formData.get("autor_associado_genero") ?? "Vereador") ||
    null) as GeneroVereador | null;
  const corpo_texto = String(formData.get("corpo_texto") ?? "").trim();
  const evento_data = String(formData.get("evento_data") ?? "").trim() || null;
  const evento_hora = String(formData.get("evento_hora") ?? "").trim() || null;
  const evento_local = String(formData.get("evento_local") ?? "").trim() || null;
  const paragrafo_fechamento =
    String(formData.get("paragrafo_fechamento") ?? "").trim() || PARAGRAFO_FECHAMENTO_PADRAO;

  return {
    tipo,
    numero,
    data_oficio,
    destinatario_tratamento,
    destinatario_nome,
    destinatario_cargo,
    destinatario_cidade_uf,
    saudacao,
    assunto,
    autor_nome,
    autor_genero: autor_nome ? autor_genero : null,
    autor_associado_nome,
    autor_associado_genero: autor_associado_nome ? autor_associado_genero : null,
    corpo_texto,
    evento_data,
    evento_hora,
    evento_local,
    paragrafo_fechamento,
  };
}

export async function criarOficio(formData: FormData) {
  const usuario = await exigirPodeCriar("/oficios");

  const campos = lerCampos(formData);

  if (
    !campos.numero ||
    !campos.data_oficio ||
    !campos.destinatario_nome ||
    !campos.destinatario_cargo ||
    !campos.assunto ||
    !campos.corpo_texto
  ) {
    redirect(
      `/oficios/novo?error=${encodeURIComponent("Preencha o número, a data, o destinatário, o assunto e o texto do ofício")}`,
    );
  }

  const ano = new Date(campos.data_oficio).getFullYear();
  const supabase = await createClient();

  const { data: oficio, error } = await supabase
    .from("oficios")
    .insert({ ...campos, ano, criado_por: usuario!.id })
    .select("id")
    .single();

  if (error || !oficio) {
    const mensagem = error?.message.includes("duplicate key")
      ? `Já existe um ofício com o número "${campos.numero}" em ${ano}. Escolha outro número.`
      : (error?.message ?? "Erro ao salvar o ofício");
    redirect(`/oficios/novo?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath("/oficios");
  redirect(`/oficios/${oficio!.id}/editar`);
}

export async function editarOficio(id: string, formData: FormData) {
  await exigirPodeGerenciar(`/oficios/${id}/editar`);

  const campos = lerCampos(formData);

  if (
    !campos.numero ||
    !campos.data_oficio ||
    !campos.destinatario_nome ||
    !campos.destinatario_cargo ||
    !campos.assunto ||
    !campos.corpo_texto
  ) {
    redirect(
      `/oficios/${id}/editar?error=${encodeURIComponent("Preencha o número, a data, o destinatário, o assunto e o texto do ofício")}`,
    );
  }

  const ano = new Date(campos.data_oficio).getFullYear();
  const supabase = await createClient();

  const { error } = await supabase
    .from("oficios")
    .update({ ...campos, ano })
    .eq("id", id);

  if (error) {
    const mensagem = error.message.includes("duplicate key")
      ? `Já existe um ofício com esse número em ${ano}. Escolha outro número.`
      : error.message;
    redirect(`/oficios/${id}/editar?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath("/oficios");
  redirect("/oficios");
}

export async function excluirOficio(id: string) {
  await exigirPodeGerenciar("/oficios");

  const supabase = await createClient();
  const { error } = await supabase.from("oficios").delete().eq("id", id);

  revalidatePath("/oficios");

  if (error) {
    redirect(`/oficios?error=${encodeURIComponent("Não foi possível excluir: " + error.message)}`);
  }

  redirect("/oficios");
}
