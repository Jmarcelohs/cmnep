"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { corpoTextoEstaVazio } from "@/lib/oficios/documento";
import { sanitizarHtmlDocumento } from "@/lib/sanitizar-html";

// Aba de uso exclusivo do Diretor Executivo — restrita a admin (ver
// migration 0043; hoje o único admin cadastrado é a própria pessoa).
export async function exigirAdmin(redirectPath: string) {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") {
    redirect(redirectPath);
  }
  return usuario;
}

function lerCampos(formData: FormData) {
  const numero = String(formData.get("numero") ?? "").trim();
  const data_oficio = String(formData.get("data_oficio") ?? "");
  // Texto livre e opcional — pode ficar vazio quando o destinatário é um
  // setor do Executivo, não uma pessoa (ver migration 0044).
  const destinatario_tratamento = String(formData.get("destinatario_tratamento") ?? "").trim();
  const destinatario_nome = String(formData.get("destinatario_nome") ?? "").trim();
  const destinatario_cargo = String(formData.get("destinatario_cargo") ?? "").trim();
  const destinatario_cidade_uf =
    String(formData.get("destinatario_cidade_uf") ?? "").trim() || null;
  const saudacao = String(formData.get("saudacao") ?? "").trim();
  const assunto = String(formData.get("assunto") ?? "").trim();
  // Sanitiza o HTML do editor de texto rico antes de qualquer outra coisa —
  // nunca confia no que o navegador de quem preencheu produziu.
  const corpo_texto = sanitizarHtmlDocumento(String(formData.get("corpo_texto") ?? "").trim());

  return {
    numero,
    data_oficio,
    destinatario_tratamento,
    destinatario_nome,
    destinatario_cargo,
    destinatario_cidade_uf,
    saudacao,
    assunto,
    corpo_texto,
  };
}

export async function criarOficioDE(formData: FormData) {
  const usuario = await exigirAdmin("/oficios-de");

  const campos = lerCampos(formData);

  if (
    !campos.numero ||
    !campos.data_oficio ||
    !campos.destinatario_nome ||
    !campos.destinatario_cargo ||
    !campos.assunto ||
    corpoTextoEstaVazio(campos.corpo_texto)
  ) {
    redirect(
      `/oficios-de/novo?error=${encodeURIComponent("Preencha o número, a data, o destinatário, o assunto e o texto do ofício")}`,
    );
  }

  const ano = new Date(campos.data_oficio).getFullYear();
  const supabase = await createClient();

  const { data: oficio, error } = await supabase
    .from("oficios_diretor_executivo")
    .insert({ ...campos, ano, criado_por: usuario!.id })
    .select("id")
    .single();

  if (error || !oficio) {
    const mensagem = error?.message.includes("duplicate key")
      ? `Já existe um ofício com o número "${campos.numero}" em ${ano}. Escolha outro número.`
      : (error?.message ?? "Erro ao salvar o ofício");
    redirect(`/oficios-de/novo?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath("/oficios-de");
  redirect(`/oficios-de/${oficio!.id}/editar`);
}

export async function editarOficioDE(id: string, formData: FormData) {
  await exigirAdmin(`/oficios-de/${id}/editar`);

  const campos = lerCampos(formData);

  if (
    !campos.numero ||
    !campos.data_oficio ||
    !campos.destinatario_nome ||
    !campos.destinatario_cargo ||
    !campos.assunto ||
    corpoTextoEstaVazio(campos.corpo_texto)
  ) {
    redirect(
      `/oficios-de/${id}/editar?error=${encodeURIComponent("Preencha o número, a data, o destinatário, o assunto e o texto do ofício")}`,
    );
  }

  const ano = new Date(campos.data_oficio).getFullYear();
  const supabase = await createClient();

  const { error } = await supabase
    .from("oficios_diretor_executivo")
    .update({ ...campos, ano })
    .eq("id", id);

  if (error) {
    const mensagem = error.message.includes("duplicate key")
      ? `Já existe um ofício com esse número em ${ano}. Escolha outro número.`
      : error.message;
    redirect(`/oficios-de/${id}/editar?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath("/oficios-de");
  redirect("/oficios-de");
}

export async function excluirOficioDE(id: string) {
  await exigirAdmin("/oficios-de");

  const supabase = await createClient();
  const { error } = await supabase.from("oficios_diretor_executivo").delete().eq("id", id);

  revalidatePath("/oficios-de");

  if (error) {
    redirect(`/oficios-de?error=${encodeURIComponent("Não foi possível excluir: " + error.message)}`);
  }

  redirect("/oficios-de");
}
