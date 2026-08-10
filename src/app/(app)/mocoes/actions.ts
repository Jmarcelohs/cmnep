"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import type { AutorAssociadoMocao, TipoMocao } from "@/lib/supabase/database.types";

async function exigirOrdenadorOuAdmin(redirectPath: string) {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin" && usuario?.papel !== "ordenador_despesa") {
    redirect(redirectPath);
  }
  return usuario;
}

// Mesmo padrão de Decretos: criação liberada pra qualquer servidor (e
// estagiário) — edição/exclusão continuam restritas a admin/ordenador da
// despesa.
async function exigirPodeCriarMocao(redirectPath: string) {
  const usuario = await getCurrentUsuario();
  if (
    usuario?.papel !== "admin" &&
    usuario?.papel !== "ordenador_despesa" &&
    usuario?.papel !== "servidor" &&
    usuario?.papel !== "estagiario"
  ) {
    redirect(redirectPath);
  }
  return usuario;
}

function lerCampos(formData: FormData) {
  const tipo = String(formData.get("tipo") ?? "") as TipoMocao;
  const data_mocao = String(formData.get("data_mocao") ?? "");
  const destinatario = String(formData.get("destinatario") ?? "").trim();
  const autor_nome = String(formData.get("autor_nome") ?? "").trim();
  const autor_partido = String(formData.get("autor_partido") ?? "").trim() || null;
  const justificativa = String(formData.get("justificativa") ?? "").trim();

  let autores_associados: AutorAssociadoMocao[] = [];
  try {
    autores_associados = JSON.parse(String(formData.get("autores_associados") ?? "[]"));
  } catch {
    autores_associados = [];
  }
  // Descarta entradas sem nome (linha adicionada e deixada em branco).
  autores_associados = autores_associados.filter((a) => a.nome?.trim());

  return {
    tipo,
    data_mocao,
    destinatario,
    autor_nome,
    autor_partido,
    autores_associados,
    justificativa,
  };
}

export async function criarMocao(formData: FormData) {
  const usuario = await exigirPodeCriarMocao("/mocoes");

  const campos = lerCampos(formData);

  if (!campos.tipo || !campos.data_mocao || !campos.destinatario || !campos.autor_nome) {
    redirect(
      `/mocoes/novo?error=${encodeURIComponent("Preencha o tipo, a data, o destinatário e o autor")}`,
    );
  }

  const supabase = await createClient();
  const { data: mocao, error } = await supabase
    .from("mocoes")
    .insert({ ...campos, criado_por: usuario!.id })
    .select("id")
    .single();

  if (error || !mocao) {
    redirect(`/mocoes/novo?error=${encodeURIComponent(error?.message ?? "Erro ao salvar a moção")}`);
  }

  revalidatePath("/mocoes");
  redirect(`/mocoes/${mocao!.id}/editar`);
}

export async function editarMocao(id: string, formData: FormData) {
  await exigirOrdenadorOuAdmin(`/mocoes/${id}/editar`);

  const campos = lerCampos(formData);

  if (!campos.tipo || !campos.data_mocao || !campos.destinatario || !campos.autor_nome) {
    redirect(
      `/mocoes/${id}/editar?error=${encodeURIComponent("Preencha o tipo, a data, o destinatário e o autor")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("mocoes").update(campos).eq("id", id);

  if (error) {
    redirect(`/mocoes/${id}/editar?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/mocoes");
  redirect("/mocoes");
}

export async function excluirMocao(id: string) {
  await exigirOrdenadorOuAdmin("/mocoes");

  const supabase = await createClient();
  const { error } = await supabase.from("mocoes").delete().eq("id", id);

  revalidatePath("/mocoes");

  if (error) {
    redirect(`/mocoes?error=${encodeURIComponent("Não foi possível excluir: " + error.message)}`);
  }

  redirect("/mocoes");
}
