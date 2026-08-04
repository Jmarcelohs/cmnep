"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { DOTACAO_ORCAMENTARIA_PADRAO } from "@/lib/decretos/documento";
import { proximoNumero } from "@/lib/numeracao";
import type { Tratamento } from "@/lib/supabase/database.types";

async function exigirOrdenadorOuAdmin(redirectPath: string) {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin" && usuario?.papel !== "ordenador_despesa") {
    redirect(redirectPath);
  }
  return usuario;
}

function lerCampos(formData: FormData) {
  const numeroManual = String(formData.get("numero") ?? "").trim();
  const data_decreto = String(formData.get("data_decreto") ?? "");
  const tratamento = (String(formData.get("tratamento") ?? "Sr.")) as Tratamento;
  const nome_homenageado = String(formData.get("nome_homenageado") ?? "").trim();
  const autor_nome = String(formData.get("autor_nome") ?? "").trim();
  const autor_partido = String(formData.get("autor_partido") ?? "").trim() || null;
  const dotacao_orcamentaria =
    String(formData.get("dotacao_orcamentaria") ?? "").trim() || DOTACAO_ORCAMENTARIA_PADRAO;
  const justificativa = String(formData.get("justificativa") ?? "").trim();

  return {
    numeroManual,
    data_decreto,
    tratamento,
    nome_homenageado,
    autor_nome,
    autor_partido,
    dotacao_orcamentaria,
    justificativa,
  };
}

export async function criarDecretoTituloHonorario(formData: FormData) {
  const usuario = await exigirOrdenadorOuAdmin("/decretos");

  const campos = lerCampos(formData);

  if (!campos.data_decreto || !campos.nome_homenageado || !campos.autor_nome) {
    redirect(
      `/decretos/novo?error=${encodeURIComponent("Preencha a data, o nome do homenageado e o autor")}`,
    );
  }

  const ano = new Date(campos.data_decreto).getFullYear();
  const supabase = await createClient();

  let numero = campos.numeroManual;
  if (!numero) {
    // Sugestão = maior número já usado nesse ano nesta tabela + 1. A
    // numeração real de "Projeto de Decreto" é compartilhada com outros
    // assuntos fora desta ferramenta, então isso é só um ponto de partida
    // — quem redige confirma/ajusta antes de salvar.
    const { data: doAno } = await supabase
      .from("decretos_titulo_honorario")
      .select("numero")
      .eq("ano", ano);

    numero = String(proximoNumero((doAno ?? []).map((r) => r.numero)));
  }

  const { data: decreto, error } = await supabase
    .from("decretos_titulo_honorario")
    .insert({
      numero,
      ano,
      data_decreto: campos.data_decreto,
      tratamento: campos.tratamento,
      nome_homenageado: campos.nome_homenageado,
      autor_nome: campos.autor_nome,
      autor_partido: campos.autor_partido,
      dotacao_orcamentaria: campos.dotacao_orcamentaria,
      justificativa: campos.justificativa,
      criado_por: usuario!.id,
    })
    .select("id")
    .single();

  if (error || !decreto) {
    const mensagem = error?.message.includes("duplicate key")
      ? `Já existe um decreto com o número "${numero}" em ${ano}. Escolha outro número.`
      : (error?.message ?? "Erro ao salvar o decreto");
    redirect(`/decretos/novo?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath("/decretos");
  redirect(`/decretos/${decreto!.id}/editar`);
}

export async function editarDecretoTituloHonorario(id: string, formData: FormData) {
  await exigirOrdenadorOuAdmin(`/decretos/${id}/editar`);

  const campos = lerCampos(formData);

  if (!campos.numeroManual || !campos.data_decreto || !campos.nome_homenageado || !campos.autor_nome) {
    redirect(
      `/decretos/${id}/editar?error=${encodeURIComponent("Preencha o número, a data, o nome do homenageado e o autor")}`,
    );
  }

  const ano = new Date(campos.data_decreto).getFullYear();
  const supabase = await createClient();

  const { error } = await supabase
    .from("decretos_titulo_honorario")
    .update({
      numero: campos.numeroManual,
      ano,
      data_decreto: campos.data_decreto,
      tratamento: campos.tratamento,
      nome_homenageado: campos.nome_homenageado,
      autor_nome: campos.autor_nome,
      autor_partido: campos.autor_partido,
      dotacao_orcamentaria: campos.dotacao_orcamentaria,
      justificativa: campos.justificativa,
    })
    .eq("id", id);

  if (error) {
    const mensagem = error.message.includes("duplicate key")
      ? `Já existe um decreto com esse número em ${ano}. Escolha outro número.`
      : error.message;
    redirect(`/decretos/${id}/editar?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath("/decretos");
  redirect("/decretos");
}

export async function excluirDecretoTituloHonorario(id: string) {
  await exigirOrdenadorOuAdmin("/decretos");

  const supabase = await createClient();
  const { error } = await supabase.from("decretos_titulo_honorario").delete().eq("id", id);

  revalidatePath("/decretos");

  if (error) {
    redirect(`/decretos?error=${encodeURIComponent("Não foi possível excluir: " + error.message)}`);
  }

  redirect("/decretos");
}
