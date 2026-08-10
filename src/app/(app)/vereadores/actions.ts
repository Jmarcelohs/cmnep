"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";

async function exigirAdmin() {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/vereadores");
  return usuario;
}

function lerCampos(formData: FormData) {
  const nome = String(formData.get("nome") ?? "").trim();
  const partido = String(formData.get("partido") ?? "").trim() || null;
  const presidente = formData.get("presidente") === "on";

  return { nome, partido, presidente };
}

// Só um vereador pode ser o Presidente por vez (unique index parcial no
// banco) — marcar um novo desmarca o anterior automaticamente, em vez de
// deixar o usuário ter que lembrar de desmarcar manualmente antes.
async function garantirPresidenteUnico(
  supabase: Awaited<ReturnType<typeof createClient>>,
  presidente: boolean,
  idExcluir?: string,
) {
  if (!presidente) return;
  let query = supabase.from("vereadores").update({ presidente: false }).eq("presidente", true);
  if (idExcluir) query = query.neq("id", idExcluir);
  await query;
}

export async function criarVereador(formData: FormData) {
  await exigirAdmin();

  const campos = lerCampos(formData);
  if (!campos.nome) {
    redirect(`/vereadores/novo?error=${encodeURIComponent("Preencha o nome")}`);
  }

  const supabase = await createClient();
  await garantirPresidenteUnico(supabase, campos.presidente);

  const { data: vereador, error } = await supabase
    .from("vereadores")
    .insert(campos)
    .select("id")
    .single();

  if (error || !vereador) {
    redirect(`/vereadores/novo?error=${encodeURIComponent(error?.message ?? "Erro ao salvar")}`);
  }

  revalidatePath("/vereadores");
  redirect(`/vereadores/${vereador!.id}/editar`);
}

export async function editarVereador(id: string, formData: FormData) {
  await exigirAdmin();

  const campos = lerCampos(formData);
  if (!campos.nome) {
    redirect(`/vereadores/${id}/editar?error=${encodeURIComponent("Preencha o nome")}`);
  }

  const supabase = await createClient();
  await garantirPresidenteUnico(supabase, campos.presidente, id);

  const { error } = await supabase.from("vereadores").update(campos).eq("id", id);

  if (error) {
    redirect(`/vereadores/${id}/editar?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/vereadores");
  redirect("/vereadores");
}

export async function alternarAtivoVereador(id: string, ativoAtual: boolean) {
  await exigirAdmin();

  const supabase = await createClient();
  await supabase.from("vereadores").update({ ativo: !ativoAtual }).eq("id", id);
  revalidatePath("/vereadores");
}

export async function excluirVereador(id: string) {
  await exigirAdmin();

  const supabase = await createClient();
  const { error } = await supabase.from("vereadores").delete().eq("id", id);

  revalidatePath("/vereadores");

  if (error) {
    redirect(`/vereadores?error=${encodeURIComponent("Não foi possível excluir: " + error.message)}`);
  }

  redirect("/vereadores");
}
