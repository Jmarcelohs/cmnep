"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { apenasDigitos } from "@/lib/reembolso/mascaras";
import { getAssunto } from "@/lib/requerimentos-internos/assuntos";
import type { CargoDeclarado, TipoRequerimentoInterno } from "@/lib/supabase/database.types";

const hoje = () => new Date().toISOString().slice(0, 10);

function lerCampos(formData: FormData) {
  const numeroManual = String(formData.get("numero") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "") as TipoRequerimentoInterno;
  const pessoa_id = String(formData.get("pessoa_id") ?? "") || null;
  const nome = String(formData.get("nome") ?? "").trim();
  const cargo = String(formData.get("cargo") ?? "") as CargoDeclarado;
  const cpf = apenasDigitos(String(formData.get("cpf") ?? "")) || null;
  const matricula = String(formData.get("matricula") ?? "").trim() || null;
  const data_requerimento = String(formData.get("data_requerimento") ?? "") || hoje();
  const assunto_key = String(formData.get("assunto_key") ?? "") || null;
  const assuntoTitulo = String(formData.get("assunto") ?? "").trim();
  const fundamento = String(formData.get("fundamento") ?? "").trim() || null;
  const pedido = String(formData.get("pedido") ?? "").trim() || null;
  const referente_a = String(formData.get("referente_a") ?? "").trim() || null;
  const valorTexto = String(formData.get("valor") ?? "").trim();
  const valor = valorTexto ? Number(valorTexto) : null;

  let campos: Record<string, string> = {};
  try {
    campos = JSON.parse(String(formData.get("campos") ?? "{}"));
  } catch {
    campos = {};
  }

  const assunto = assunto_key ? getAssunto(tipo, assunto_key) : undefined;
  const assunto_resolvido = assunto?.label || assuntoTitulo;

  return {
    numeroManual,
    tipo,
    pessoa_id,
    nome,
    cargo,
    cpf,
    matricula,
    data_requerimento,
    assunto_key,
    assunto: assunto_resolvido,
    fundamento,
    campos,
    pedido,
    referente_a,
    valor,
  };
}

export async function criarRequerimentoInterno(formData: FormData) {
  const usuario = await getCurrentUsuario();
  if (!usuario) redirect("/login");

  const campos = lerCampos(formData);

  // Nenhum campo é obrigatório — o requerimento é salvo com o que foi
  // preenchido, sem travar por falta de dado.
  const assunto = campos.assunto_key ? getAssunto(campos.tipo, campos.assunto_key) : undefined;
  const modoEstruturado = Boolean(assunto?.fields?.length);

  const supabase = await createClient();
  const ano = new Date(campos.data_requerimento).getFullYear();

  let numero = campos.numeroManual;
  if (!numero) {
    const { data: numeroGerado, error: numeroError } = await supabase.rpc(
      "proximo_protocolo_requerimento_interno",
      { p_tipo: campos.tipo, p_ano: ano },
    );
    if (numeroError || numeroGerado == null) {
      redirect(
        `/requerimentos-internos/novo?error=${encodeURIComponent(numeroError?.message ?? "Erro ao gerar o protocolo")}`,
      );
    }
    numero = String(numeroGerado).padStart(3, "0");
  }

  const { data: requerimento, error } = await supabase
    .from("requerimentos_internos")
    .insert({
      numero,
      ano,
      tipo: campos.tipo,
      pessoa_id: campos.pessoa_id,
      nome: campos.nome,
      cargo: campos.cargo,
      cpf: campos.cpf,
      matricula: campos.matricula,
      data_requerimento: campos.data_requerimento,
      assunto_key: campos.assunto_key,
      assunto: campos.assunto,
      fundamento: campos.fundamento,
      campos: modoEstruturado ? campos.campos : {},
      pedido: modoEstruturado ? null : campos.pedido,
      referente_a: modoEstruturado ? null : campos.referente_a,
      valor: campos.valor,
      criado_por: usuario.id,
    })
    .select("id")
    .single();

  if (error || !requerimento) {
    const mensagem = error?.message.includes("duplicate key")
      ? `Já existe um requerimento com o número "${numero}" nessa categoria em ${ano}. Escolha outro número.`
      : (error?.message ?? "Erro ao salvar o requerimento");
    redirect(`/requerimentos-internos/novo?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath("/requerimentos-internos");
  redirect(`/requerimentos-internos/${requerimento!.id}`);
}

export async function editarRequerimentoInterno(id: string, formData: FormData) {
  const campos = lerCampos(formData);

  const assunto = campos.assunto_key ? getAssunto(campos.tipo, campos.assunto_key) : undefined;
  const modoEstruturado = Boolean(assunto?.fields?.length);

  const supabase = await createClient();
  const ano = new Date(campos.data_requerimento).getFullYear();

  const { error } = await supabase
    .from("requerimentos_internos")
    .update({
      numero: campos.numeroManual,
      ano,
      pessoa_id: campos.pessoa_id,
      nome: campos.nome,
      cargo: campos.cargo,
      cpf: campos.cpf,
      matricula: campos.matricula,
      data_requerimento: campos.data_requerimento,
      assunto_key: campos.assunto_key,
      assunto: campos.assunto,
      fundamento: campos.fundamento,
      campos: modoEstruturado ? campos.campos : {},
      pedido: modoEstruturado ? null : campos.pedido,
      referente_a: modoEstruturado ? null : campos.referente_a,
      valor: campos.valor,
    })
    .eq("id", id);

  if (error) {
    const mensagem = error.message.includes("duplicate key")
      ? `Já existe um requerimento com esse número nessa categoria em ${ano}. Escolha outro número.`
      : error.message;
    redirect(`/requerimentos-internos/${id}/editar?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath(`/requerimentos-internos/${id}`);
  revalidatePath("/requerimentos-internos");
  redirect(`/requerimentos-internos/${id}`);
}

export async function excluirRequerimentoInterno(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("requerimentos_internos").delete().eq("id", id);

  revalidatePath("/requerimentos-internos");

  if (error) {
    redirect(
      `/requerimentos-internos?error=${encodeURIComponent("Não foi possível excluir: " + error.message)}`,
    );
  }

  redirect("/requerimentos-internos");
}

export async function marcarEmAnaliseRequerimentoInterno(id: string) {
  const supabase = await createClient();
  await supabase.from("requerimentos_internos").update({ status: "analise" }).eq("id", id);
  revalidatePath(`/requerimentos-internos/${id}`);
  revalidatePath("/requerimentos-internos");
}

export async function autorizarRequerimentoInterno(id: string) {
  const supabase = await createClient();
  await supabase
    .from("requerimentos_internos")
    .update({ status: "deferido", decisao: "autorizado", decisao_data: hoje() })
    .eq("id", id);
  revalidatePath(`/requerimentos-internos/${id}`);
  revalidatePath("/requerimentos-internos");
}

export async function naoAutorizarRequerimentoInterno(id: string) {
  const supabase = await createClient();
  await supabase
    .from("requerimentos_internos")
    .update({ status: "indeferido", decisao: "nao_autorizado", decisao_data: hoje() })
    .eq("id", id);
  revalidatePath(`/requerimentos-internos/${id}`);
  revalidatePath("/requerimentos-internos");
}

export type ResultadoLoteRequerimentoInterno = {
  aplicados: number;
  ignorados: { nome: string; motivo: string }[];
};

// Chamada diretamente do cliente (não via <form action>) — precisa do
// resultado (aplicados/ignorados) de volta pra tela. Checa papel e estado
// no servidor, diferente das ações individuais acima (gate só na UI). Sem
// gestor_diarias aqui — mesma regra mais estreita que a decisão individual
// já tem hoje (podeGerenciarSempre em requerimentos-internos/page.tsx).
export async function decidirRequerimentosInternosEmLote(
  ids: string[],
  decisao: "deferido" | "indeferido" | "analise",
): Promise<ResultadoLoteRequerimentoInterno> {
  const usuario = await getCurrentUsuario();
  const supabase = await createClient();

  const papelPermitido = usuario?.papel === "admin" || usuario?.papel === "ordenador_despesa";
  if (!usuario || !papelPermitido || ids.length === 0) return { aplicados: 0, ignorados: [] };

  const { data: requerimentos } = await supabase
    .from("requerimentos_internos")
    .select("id, numero, ano, status")
    .in("id", ids);

  const aplicaveis: string[] = [];
  const ignorados: { nome: string; motivo: string }[] = [];

  for (const r of requerimentos ?? []) {
    const nome = `${r.numero}/${r.ano}`;
    if (r.status === "deferido" || r.status === "indeferido") {
      ignorados.push({ nome, motivo: "já foi decidido" });
    } else {
      aplicaveis.push(r.id);
    }
  }

  if (aplicaveis.length > 0) {
    const dados =
      decisao === "analise"
        ? { status: "analise" as const }
        : {
            status: decisao,
            decisao: decisao === "deferido" ? ("autorizado" as const) : ("nao_autorizado" as const),
            decisao_data: hoje(),
          };
    await supabase.from("requerimentos_internos").update(dados).in("id", aplicaveis);
    revalidatePath("/requerimentos-internos");
  }

  return { aplicados: aplicaveis.length, ignorados };
}
