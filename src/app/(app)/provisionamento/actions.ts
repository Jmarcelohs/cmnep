"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import type { Database } from "@/lib/supabase/database.types";
import type { Contrato, NovoContrato } from "@/lib/provisionamento/tipos";

// Movimento orçamentário/contábil — mesma sensibilidade de Suplementações
// Orçamentárias, restrito a admin.
async function exigirAdmin() {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") {
    throw new Error("Acesso restrito a administradores.");
  }
  return usuario;
}

type LinhaContrato = Database["public"]["Tables"]["provisionamento_contratos"]["Row"];

function paraLinhaDb(dados: NovoContrato) {
  return {
    nome: dados.nome,
    fornecedor: dados.fornecedor,
    valor_vigente: dados.valorVigente,
    tipo_valor: dados.tipoValor,
    data_inicio_vigencia: dados.dataInicioVigencia,
    data_fim_vigencia: dados.dataFimVigencia,
    data_proximo_reajuste: dados.dataProximoReajuste,
    indice_correcao: dados.indiceCorrecao,
    percentual_estimado: dados.percentualEstimado,
    situacao: dados.situacao,
    valor_novo_contrato_estimado: dados.valorNovoContratoEstimado,
    data_inicio_novo_contrato: dados.dataInicioNovoContrato,
    ficha_orcamentaria: dados.fichaOrcamentaria,
    dotacao: dados.dotacao,
    elemento_despesa: dados.elementoDespesa,
    observacoes: dados.observacoes,
  };
}

function paraContrato(linha: LinhaContrato): Contrato {
  return {
    id: linha.id,
    nome: linha.nome,
    fornecedor: linha.fornecedor,
    valorVigente: linha.valor_vigente,
    tipoValor: linha.tipo_valor,
    dataInicioVigencia: linha.data_inicio_vigencia,
    dataFimVigencia: linha.data_fim_vigencia,
    dataProximoReajuste: linha.data_proximo_reajuste,
    indiceCorrecao: linha.indice_correcao as Contrato["indiceCorrecao"],
    percentualEstimado: Number(linha.percentual_estimado),
    situacao: linha.situacao,
    valorNovoContratoEstimado: linha.valor_novo_contrato_estimado,
    dataInicioNovoContrato: linha.data_inicio_novo_contrato,
    fichaOrcamentaria: linha.ficha_orcamentaria,
    dotacao: linha.dotacao,
    elementoDespesa: linha.elemento_despesa,
    observacoes: linha.observacoes,
    criadoEm: linha.criado_em,
  };
}

export async function listarContratos(): Promise<Contrato[]> {
  await exigirAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("provisionamento_contratos")
    .select("*")
    .order("nome");
  if (error) throw new Error(error.message);
  return (data ?? []).map(paraContrato);
}

export async function criarContrato(dados: NovoContrato): Promise<Contrato> {
  const usuario = await exigirAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("provisionamento_contratos")
    .insert({ ...paraLinhaDb(dados), criado_por: usuario!.id })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "Erro ao salvar o contrato.");
  revalidatePath("/provisionamento");
  return paraContrato(data);
}

export async function editarContrato(id: string, dados: NovoContrato): Promise<Contrato> {
  await exigirAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("provisionamento_contratos")
    .update({ ...paraLinhaDb(dados), atualizado_em: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? "Erro ao atualizar o contrato.");
  revalidatePath("/provisionamento");
  return paraContrato(data);
}

export async function excluirContrato(id: string): Promise<void> {
  await exigirAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("provisionamento_contratos").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/provisionamento");
}

// Substitui todos os contratos pelos da lista importada — mais simples e
// seguro que tentar mesclar/diferenciar quais linhas mudaram (mesma
// convenção já usada em editarSuplementacao, ver actions.ts de lá).
export async function importarContratos(lista: NovoContrato[]): Promise<Contrato[]> {
  const usuario = await exigirAdmin();
  const supabase = await createClient();

  const { error: erroExclusao } = await supabase
    .from("provisionamento_contratos")
    .delete()
    .not("id", "is", null);
  if (erroExclusao) throw new Error(erroExclusao.message);

  if (lista.length === 0) {
    revalidatePath("/provisionamento");
    return [];
  }

  const { data, error } = await supabase
    .from("provisionamento_contratos")
    .insert(lista.map((c) => ({ ...paraLinhaDb(c), criado_por: usuario!.id })))
    .select();
  if (error) throw new Error(error.message);
  revalidatePath("/provisionamento");
  return (data ?? []).map(paraContrato);
}

export async function apagarTodosContratos(): Promise<void> {
  await exigirAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("provisionamento_contratos").delete().not("id", "is", null);
  if (error) throw new Error(error.message);
  revalidatePath("/provisionamento");
}
