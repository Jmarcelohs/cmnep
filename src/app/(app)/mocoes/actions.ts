"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import type { TipoMocao, Tratamento } from "@/lib/supabase/database.types";

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
  // Só relevante pro tipo 'pesar' — nos demais tipos fica null.
  const destinatario_tratamento =
    tipo === "pesar" ? (String(formData.get("destinatario_tratamento") ?? "Sr.") as Tratamento) : null;
  const autor_vereador_id = String(formData.get("autor_vereador_id") ?? "").trim();
  // 'pesar' usa texto de pêsames fixo (ver PARAGRAFOS_PESAR_FIXOS) — não
  // tem campo de justificativa no formulário pra esse tipo.
  const justificativa = tipo === "pesar" ? "" : String(formData.get("justificativa") ?? "").trim();

  let associados_vereadores_ids: string[] = [];
  try {
    associados_vereadores_ids = JSON.parse(String(formData.get("associados_vereadores_ids") ?? "[]"));
  } catch {
    associados_vereadores_ids = [];
  }
  associados_vereadores_ids = associados_vereadores_ids.filter(
    (id) => typeof id === "string" && id && id !== autor_vereador_id,
  );

  return {
    tipo,
    data_mocao,
    destinatario,
    destinatario_tratamento,
    autor_vereador_id,
    associados_vereadores_ids,
    justificativa,
  };
}

function validarCampos(campos: ReturnType<typeof lerCampos>): string | null {
  if (!campos.tipo || !campos.data_mocao || !campos.destinatario || !campos.autor_vereador_id) {
    return "Preencha o tipo, a data, o destinatário e o autor";
  }
  if (campos.tipo !== "pesar" && !campos.justificativa) {
    return "Preencha a justificativa";
  }
  return null;
}

export async function criarMocao(formData: FormData) {
  const usuario = await exigirPodeCriarMocao("/mocoes");

  const campos = lerCampos(formData);
  const erroValidacao = validarCampos(campos);
  if (erroValidacao) {
    redirect(`/mocoes/novo?error=${encodeURIComponent(erroValidacao)}`);
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
  const erroValidacao = validarCampos(campos);
  if (erroValidacao) {
    redirect(`/mocoes/${id}/editar?error=${encodeURIComponent(erroValidacao)}`);
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
