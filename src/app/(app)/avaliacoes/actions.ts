"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { calcularResumo, validarItens } from "@/lib/avaliacoes/calculo";
import { getTemplate } from "@/lib/avaliacoes/templates";
import type { AvaliadorLancado, ItemAvaliacaoLancado, PeriodoAvaliacao } from "@/lib/supabase/database.types";

const TEMPLATE_PADRAO = "estagio_probatorio";

function lerAvaliacaoFormData(formData: FormData) {
  const pessoa_id = String(formData.get("pessoa_id") ?? "").trim();
  const ano = Number(formData.get("ano") ?? "");
  const periodo = String(formData.get("periodo") ?? "") as PeriodoAvaliacao;
  const data_avaliacao = String(formData.get("data_avaliacao") ?? "").trim();
  const pontos_melhorar = String(formData.get("pontos_melhorar") ?? "").trim() || null;
  const pontos_positivos = String(formData.get("pontos_positivos") ?? "").trim() || null;

  let avaliadores: AvaliadorLancado[] = [];
  let itens: ItemAvaliacaoLancado[] = [];
  try {
    avaliadores = JSON.parse(String(formData.get("avaliadores") ?? "[]"));
    itens = JSON.parse(String(formData.get("itens") ?? "[]"));
  } catch {
    // formatos inválidos caem na validação abaixo como listas vazias
  }

  return { pessoa_id, ano, periodo, data_avaliacao, pontos_melhorar, pontos_positivos, avaliadores, itens };
}

export async function criarAvaliacao(formData: FormData) {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/avaliacoes");

  const dados = lerAvaliacaoFormData(formData);
  const template = getTemplate(TEMPLATE_PADRAO);

  if (!dados.pessoa_id || !dados.ano || !dados.periodo || !dados.data_avaliacao) {
    redirect(`/avaliacoes/novo?error=${encodeURIComponent("Preencha servidor, ano, período e data")}`);
  }

  const erros = validarItens(dados.itens, template);
  if (erros.length > 0) {
    redirect(`/avaliacoes/novo?error=${encodeURIComponent(`Avaliação incompleta: ${erros[0]}`)}`);
  }

  const resumo = calcularResumo(dados.itens, template);

  const supabase = await createClient();
  const { error } = await supabase.from("avaliacoes").insert({
    pessoa_id: dados.pessoa_id,
    ano: dados.ano,
    periodo: dados.periodo,
    template: TEMPLATE_PADRAO,
    data_avaliacao: dados.data_avaliacao,
    avaliadores: dados.avaliadores,
    itens: dados.itens,
    pontos_melhorar: dados.pontos_melhorar,
    pontos_positivos: dados.pontos_positivos,
    nota_final: resumo.notaFinal,
    criado_por: usuario.id,
  });

  if (error) {
    const mensagem = error.message.includes("duplicate key")
      ? "Já existe uma avaliação lançada para esse servidor, ano e período."
      : error.message;
    redirect(`/avaliacoes/novo?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath("/avaliacoes");
  redirect("/avaliacoes");
}

export async function editarAvaliacao(id: string, formData: FormData) {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/avaliacoes");

  const dados = lerAvaliacaoFormData(formData);
  const template = getTemplate(TEMPLATE_PADRAO);

  if (!dados.pessoa_id || !dados.ano || !dados.periodo || !dados.data_avaliacao) {
    redirect(`/avaliacoes/${id}/editar?error=${encodeURIComponent("Preencha servidor, ano, período e data")}`);
  }

  const erros = validarItens(dados.itens, template);
  if (erros.length > 0) {
    redirect(`/avaliacoes/${id}/editar?error=${encodeURIComponent(`Avaliação incompleta: ${erros[0]}`)}`);
  }

  const resumo = calcularResumo(dados.itens, template);

  const supabase = await createClient();
  const { error } = await supabase
    .from("avaliacoes")
    .update({
      pessoa_id: dados.pessoa_id,
      ano: dados.ano,
      periodo: dados.periodo,
      data_avaliacao: dados.data_avaliacao,
      avaliadores: dados.avaliadores,
      itens: dados.itens,
      pontos_melhorar: dados.pontos_melhorar,
      pontos_positivos: dados.pontos_positivos,
      nota_final: resumo.notaFinal,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    const mensagem = error.message.includes("duplicate key")
      ? "Já existe uma avaliação lançada para esse servidor, ano e período."
      : error.message;
    redirect(`/avaliacoes/${id}/editar?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath("/avaliacoes");
  revalidatePath(`/avaliacoes/${id}`);
  redirect(`/avaliacoes/${id}`);
}

export async function excluirAvaliacao(id: string) {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/avaliacoes");

  const supabase = await createClient();
  const { error } = await supabase.from("avaliacoes").delete().eq("id", id);

  revalidatePath("/avaliacoes");

  if (error) {
    redirect(`/avaliacoes?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/avaliacoes");
}

export async function criarAvaliador(formData: FormData) {
  const supabase = await createClient();

  const nome = String(formData.get("nome") ?? "").trim();
  const matricula = String(formData.get("matricula") ?? "").trim() || null;

  if (!nome) {
    redirect(`/avaliacoes/avaliadores/novo?error=${encodeURIComponent("Preencha o nome")}`);
  }

  const { error } = await supabase.from("avaliacoes_avaliadores").insert({ nome, matricula });

  if (error) {
    redirect(`/avaliacoes/avaliadores/novo?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/avaliacoes/avaliadores");
  redirect("/avaliacoes/avaliadores");
}

export async function editarAvaliador(id: string, formData: FormData) {
  const supabase = await createClient();

  const nome = String(formData.get("nome") ?? "").trim();
  const matricula = String(formData.get("matricula") ?? "").trim() || null;

  if (!nome) {
    redirect(`/avaliacoes/avaliadores/${id}/editar?error=${encodeURIComponent("Preencha o nome")}`);
  }

  const { error } = await supabase
    .from("avaliacoes_avaliadores")
    .update({ nome, matricula })
    .eq("id", id);

  if (error) {
    redirect(`/avaliacoes/avaliadores/${id}/editar?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/avaliacoes/avaliadores");
  redirect("/avaliacoes/avaliadores");
}

export async function alternarAtivoAvaliador(id: string, ativoAtual: boolean) {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") return;

  const supabase = await createClient();
  await supabase.from("avaliacoes_avaliadores").update({ ativo: !ativoAtual }).eq("id", id);
  revalidatePath("/avaliacoes/avaliadores");
}
