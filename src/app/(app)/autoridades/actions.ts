"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import type { TratamentoOficio } from "@/lib/supabase/database.types";

async function exigirAdmin() {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/autoridades");
  return usuario;
}

function lerCampos(formData: FormData) {
  const tratamento = String(
    formData.get("tratamento") ?? "Excelentíssimo Senhor",
  ) as TratamentoOficio;
  const nome = String(formData.get("nome") ?? "").trim();
  const cargo = String(formData.get("cargo") ?? "").trim();
  const cidade_uf = String(formData.get("cidade_uf") ?? "").trim() || null;

  return { tratamento, nome, cargo, cidade_uf };
}

export async function criarAutoridade(formData: FormData) {
  await exigirAdmin();

  const campos = lerCampos(formData);
  if (!campos.nome || !campos.cargo) {
    redirect(`/autoridades/nova?error=${encodeURIComponent("Preencha nome e cargo")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("autoridades").insert(campos);

  if (error) {
    redirect(`/autoridades/nova?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/autoridades");
  redirect("/autoridades");
}

export async function editarAutoridade(id: string, formData: FormData) {
  await exigirAdmin();

  const campos = lerCampos(formData);
  if (!campos.nome || !campos.cargo) {
    redirect(`/autoridades/${id}/editar?error=${encodeURIComponent("Preencha nome e cargo")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("autoridades").update(campos).eq("id", id);

  if (error) {
    redirect(`/autoridades/${id}/editar?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/autoridades");
  redirect("/autoridades");
}

export async function alternarAtivoAutoridade(id: string, ativoAtual: boolean) {
  await exigirAdmin();

  const supabase = await createClient();
  await supabase.from("autoridades").update({ ativo: !ativoAtual }).eq("id", id);
  revalidatePath("/autoridades");
}

export async function excluirAutoridade(id: string) {
  await exigirAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("autoridades").delete().eq("id", id);

  revalidatePath("/autoridades");

  if (error) {
    redirect(`/autoridades?error=${encodeURIComponent("Não foi possível excluir: " + error.message)}`);
  }

  redirect("/autoridades");
}
