"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { sanitizarHtmlDocumento } from "@/lib/sanitizar-html";

// Movimento orçamentário/contábil — fora de Secretaria e Decretos,
// restrito a admin (hoje só o próprio usuário admin cadastrado, ver
// migration 0046).
export async function exigirAdmin(redirectPath: string) {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") {
    redirect(redirectPath);
  }
  return usuario;
}

type LinhaBruta = { fichaId: string; valor: string };

function lerLinhas(formData: FormData, campo: string): { fichaId: string; valor: number }[] {
  const bruto = String(formData.get(campo) ?? "[]");
  let linhas: LinhaBruta[];
  try {
    linhas = JSON.parse(bruto);
  } catch {
    linhas = [];
  }
  return linhas
    .map((l) => ({ fichaId: l.fichaId, valor: Number(l.valor) }))
    .filter((l) => l.fichaId && l.valor > 0);
}

function lerCampos(formData: FormData) {
  const data_ato = String(formData.get("data_ato") ?? "");
  const numero_decreto = String(formData.get("numero_decreto") ?? "").trim() || null;
  const data_decreto = String(formData.get("data_decreto") ?? "").trim() || null;
  const itensDestino = lerLinhas(formData, "itens_destino");
  const itensOrigem = lerLinhas(formData, "itens_origem");
  // Sanitiza de novo aqui (o editor já sanitiza no cliente, mas nunca
  // confia no que chega de fora — mesma convenção dos Ofícios). Vazio vira
  // null: gerarPdfDeRota então remonta o texto padrão a partir das fichas
  // (ver montarCorpoAtoPadrao/montarCorpoDecretoPadrao).
  const corpo_ato_html =
    sanitizarHtmlDocumento(String(formData.get("corpo_ato_html") ?? "")).trim() || null;
  const corpo_decreto_html =
    sanitizarHtmlDocumento(String(formData.get("corpo_decreto_html") ?? "")).trim() || null;

  return {
    data_ato,
    numero_decreto,
    data_decreto,
    corpo_ato_html,
    corpo_decreto_html,
    itensDestino,
    itensOrigem,
  };
}

// O <input type="date"> nativo aceita perder foco com o ano incompleto
// (ex.: digitou "2" e saiu do campo antes de completar "2026") e manda
// "0002-08-12" sem avisar — já aconteceu na prática (data do Decreto saiu
// "12 de agosto de 2"). Valida o formato completo antes de gravar.
const DATA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;

function validar(campos: ReturnType<typeof lerCampos>): string | null {
  if (!campos.data_ato) return "Preencha a data do Ato";
  if (!DATA_VALIDA.test(campos.data_ato)) return "Data do Ato inválida — confira o ano preenchido";
  if (campos.data_decreto && !DATA_VALIDA.test(campos.data_decreto)) {
    return "Data do Decreto inválida — confira o ano preenchido";
  }
  if (campos.itensDestino.length === 0) return "Inclua ao menos um item de destino (Art. 1º)";
  if (campos.itensOrigem.length === 0) return "Inclua ao menos um item de origem (Art. 2º)";

  const totalDestino = campos.itensDestino.reduce((s, i) => s + i.valor, 0);
  const totalOrigem = campos.itensOrigem.reduce((s, i) => s + i.valor, 0);
  if (Math.abs(totalDestino - totalOrigem) >= 0.01) {
    return "O total de destino (Art. 1º) precisa ser igual ao total de origem (Art. 2º)";
  }
  return null;
}

async function gravarItens(
  supabase: Awaited<ReturnType<typeof createClient>>,
  suplementacaoId: string,
  campos: ReturnType<typeof lerCampos>,
) {
  const linhas = [
    ...campos.itensDestino.map((i, ordem) => ({
      suplementacao_id: suplementacaoId,
      ficha_id: i.fichaId,
      tipo: "destino" as const,
      valor: i.valor,
      ordem,
    })),
    ...campos.itensOrigem.map((i, ordem) => ({
      suplementacao_id: suplementacaoId,
      ficha_id: i.fichaId,
      tipo: "origem" as const,
      valor: i.valor,
      ordem,
    })),
  ];
  const { error } = await supabase.from("suplementacoes_itens").insert(linhas);
  return error;
}

export async function criarSuplementacao(formData: FormData) {
  const usuario = await exigirAdmin("/suplementacoes");
  const campos = lerCampos(formData);

  const erro = validar(campos);
  if (erro) {
    redirect(`/suplementacoes/novo?error=${encodeURIComponent(erro)}`);
  }

  const supabase = await createClient();
  const { data: suplementacao, error } = await supabase
    .from("suplementacoes_orcamentarias")
    .insert({
      data_ato: campos.data_ato,
      numero_decreto: campos.numero_decreto,
      data_decreto: campos.data_decreto,
      corpo_ato_html: campos.corpo_ato_html,
      corpo_decreto_html: campos.corpo_decreto_html,
      criado_por: usuario!.id,
    })
    .select("id")
    .single();

  if (error || !suplementacao) {
    redirect(
      `/suplementacoes/novo?error=${encodeURIComponent(error?.message ?? "Erro ao salvar a suplementação")}`,
    );
  }

  const erroItens = await gravarItens(supabase, suplementacao!.id, campos);
  if (erroItens) {
    // Suplementação já foi criada mas os itens falharam — remove pra não
    // deixar um registro incompleto (sem nenhum item) na lista.
    await supabase.from("suplementacoes_orcamentarias").delete().eq("id", suplementacao!.id);
    redirect(`/suplementacoes/novo?error=${encodeURIComponent(erroItens.message)}`);
  }

  revalidatePath("/suplementacoes");
  redirect(`/suplementacoes/${suplementacao!.id}/editar`);
}

export async function editarSuplementacao(id: string, formData: FormData) {
  await exigirAdmin(`/suplementacoes/${id}/editar`);
  const campos = lerCampos(formData);

  const erro = validar(campos);
  if (erro) {
    redirect(`/suplementacoes/${id}/editar?error=${encodeURIComponent(erro)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("suplementacoes_orcamentarias")
    .update({
      data_ato: campos.data_ato,
      numero_decreto: campos.numero_decreto,
      data_decreto: campos.data_decreto,
      corpo_ato_html: campos.corpo_ato_html,
      corpo_decreto_html: campos.corpo_decreto_html,
    })
    .eq("id", id);

  if (error) {
    redirect(`/suplementacoes/${id}/editar?error=${encodeURIComponent(error.message)}`);
  }

  // Reconstrói os itens do zero (mais simples e seguro que tentar
  // diferenciar quais linhas mudaram/sumiram/foram adicionadas).
  await supabase.from("suplementacoes_itens").delete().eq("suplementacao_id", id);
  const erroItens = await gravarItens(supabase, id, campos);
  if (erroItens) {
    redirect(`/suplementacoes/${id}/editar?error=${encodeURIComponent(erroItens.message)}`);
  }

  revalidatePath("/suplementacoes");
  redirect(`/suplementacoes/${id}/editar?salvo=1`);
}

export async function excluirSuplementacao(id: string) {
  await exigirAdmin("/suplementacoes");

  const supabase = await createClient();
  const { error } = await supabase.from("suplementacoes_orcamentarias").delete().eq("id", id);

  revalidatePath("/suplementacoes");

  if (error) {
    redirect(
      `/suplementacoes?error=${encodeURIComponent("Não foi possível excluir: " + error.message)}`,
    );
  }

  redirect("/suplementacoes");
}
