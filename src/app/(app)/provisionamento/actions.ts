"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import type { Database } from "@/lib/supabase/database.types";
import type { Contrato, DotacaoOrcamentaria, LoaProjecao, NovaLoaLinha, NovoContrato } from "@/lib/provisionamento/tipos";

// Movimento orçamentário/contábil — mesma sensibilidade de Suplementações
// Orçamentárias, restrito a admin.
async function exigirAdmin() {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") {
    throw new Error("Acesso restrito a administradores.");
  }
  return usuario;
}

// Toda leitura de contrato traz a ficha vinculada junto (join numa query
// só) — o resto do módulo (cálculo, exibição) trabalha sempre com o
// registro completo da ficha, nunca só o id.
const SELECT_COM_FICHA = "*, ficha:dotacoes_orcamentarias(*)";

type LinhaContrato = Database["public"]["Tables"]["provisionamento_contratos"]["Row"] & {
  ficha: DotacaoOrcamentaria | null;
};

function paraLinhaDb(dados: NovoContrato) {
  return {
    nome: dados.nome,
    fornecedor: dados.fornecedor,
    modalidade: dados.modalidade,
    valor_vigente: dados.valorVigente,
    tipo_valor: dados.tipoValor,
    valor_unitario: dados.valorUnitario,
    unidade_medida: dados.unidadeMedida,
    quantidade_estimada_mensal: dados.quantidadeEstimadaMensal,
    data_inicio_vigencia: dados.dataInicioVigencia,
    data_fim_vigencia: dados.dataFimVigencia,
    data_proximo_reajuste: dados.dataProximoReajuste,
    indice_correcao: dados.indiceCorrecao,
    percentual_estimado: dados.percentualEstimado,
    situacao: dados.situacao,
    valor_novo_contrato_estimado: dados.valorNovoContratoEstimado,
    data_inicio_novo_contrato: dados.dataInicioNovoContrato,
    ficha_id: dados.fichaId,
    observacoes: dados.observacoes,
  };
}

function paraContrato(linha: LinhaContrato): Contrato {
  return {
    id: linha.id,
    nome: linha.nome,
    fornecedor: linha.fornecedor,
    modalidade: linha.modalidade,
    valorVigente: linha.valor_vigente,
    tipoValor: linha.tipo_valor,
    valorUnitario: linha.valor_unitario,
    unidadeMedida: linha.unidade_medida,
    quantidadeEstimadaMensal: linha.quantidade_estimada_mensal,
    dataInicioVigencia: linha.data_inicio_vigencia,
    dataFimVigencia: linha.data_fim_vigencia,
    dataProximoReajuste: linha.data_proximo_reajuste,
    indiceCorrecao: linha.indice_correcao as Contrato["indiceCorrecao"],
    percentualEstimado: Number(linha.percentual_estimado),
    situacao: linha.situacao,
    valorNovoContratoEstimado: linha.valor_novo_contrato_estimado,
    dataInicioNovoContrato: linha.data_inicio_novo_contrato,
    fichaId: linha.ficha_id,
    ficha: linha.ficha,
    observacoes: linha.observacoes,
    criadoEm: linha.criado_em,
  };
}

export async function listarContratos(): Promise<Contrato[]> {
  await exigirAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("provisionamento_contratos")
    .select(SELECT_COM_FICHA)
    .order("nome");
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as LinhaContrato[]).map(paraContrato);
}

// Fichas ativas de dotacoes_orcamentarias (mesmo cadastro usado em
// Suplementações Orçamentárias) — pro seletor de ficha do formulário.
export async function listarFichasAtivas(): Promise<DotacaoOrcamentaria[]> {
  await exigirAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dotacoes_orcamentarias")
    .select("*")
    .eq("ativo", true)
    .order("ficha");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function criarContrato(dados: NovoContrato): Promise<Contrato> {
  const usuario = await exigirAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("provisionamento_contratos")
    .insert({ ...paraLinhaDb(dados), criado_por: usuario!.id })
    .select(SELECT_COM_FICHA)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Erro ao salvar o contrato.");
  revalidatePath("/provisionamento");
  return paraContrato(data as unknown as LinhaContrato);
}

export async function editarContrato(id: string, dados: NovoContrato): Promise<Contrato> {
  await exigirAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("provisionamento_contratos")
    .update({ ...paraLinhaDb(dados), atualizado_em: new Date().toISOString() })
    .eq("id", id)
    .select(SELECT_COM_FICHA)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Erro ao atualizar o contrato.");
  revalidatePath("/provisionamento");
  return paraContrato(data as unknown as LinhaContrato);
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
    .select(SELECT_COM_FICHA);
  if (error) throw new Error(error.message);
  revalidatePath("/provisionamento");
  return ((data ?? []) as unknown as LinhaContrato[]).map(paraContrato);
}

export async function apagarTodosContratos(): Promise<void> {
  await exigirAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("provisionamento_contratos").delete().not("id", "is", null);
  if (error) throw new Error(error.message);
  revalidatePath("/provisionamento");
}

// Proposta LOA 2027 (migration 0056) — ano fixo por enquanto (ver
// tipos.ts); um seletor de ano/múltiplas propostas fica pra quando
// precisar de 2028.
const ANO_LOA = 2027;

type LinhaLoaDb = Database["public"]["Tables"]["loa_projecoes"]["Row"];

function paraLoaProjecao(linha: LinhaLoaDb): LoaProjecao {
  return {
    id: linha.id,
    ano: linha.ano,
    dotacaoOrigemId: linha.dotacao_origem_id,
    orgaoCodigo: linha.orgao_codigo,
    orgaoNome: linha.orgao_nome,
    unidadeCodigo: linha.unidade_codigo,
    unidadeNome: linha.unidade_nome,
    subfuncaoCodigo: linha.subfuncao_codigo,
    subfuncaoNome: linha.subfuncao_nome,
    programaCodigo: linha.programa_codigo,
    programaNome: linha.programa_nome,
    projetoAtividadeCodigo: linha.projeto_atividade_codigo,
    projetoAtividadeNome: linha.projeto_atividade_nome,
    elementoCodigo: linha.elemento_codigo,
    elementoNome: linha.elemento_nome,
    fonteCodigo: linha.fonte_codigo,
    fonteNome: linha.fonte_nome,
    valorProjetado: linha.valor_projetado,
    criadoEm: linha.criado_em,
  };
}

function paraLoaLinhaDb(linha: NovaLoaLinha) {
  return {
    ano: ANO_LOA,
    dotacao_origem_id: linha.dotacaoOrigemId,
    orgao_codigo: linha.orgaoCodigo,
    orgao_nome: linha.orgaoNome,
    unidade_codigo: linha.unidadeCodigo,
    unidade_nome: linha.unidadeNome,
    subfuncao_codigo: linha.subfuncaoCodigo,
    subfuncao_nome: linha.subfuncaoNome,
    programa_codigo: linha.programaCodigo,
    programa_nome: linha.programaNome,
    projeto_atividade_codigo: linha.projetoAtividadeCodigo,
    projeto_atividade_nome: linha.projetoAtividadeNome,
    elemento_codigo: linha.elementoCodigo,
    elemento_nome: linha.elementoNome,
    fonte_codigo: linha.fonteCodigo,
    fonte_nome: linha.fonteNome,
    valor_projetado: linha.valorProjetado,
  };
}

export async function listarLoaProjecao(): Promise<LoaProjecao[]> {
  await exigirAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loa_projecoes")
    .select("*")
    .eq("ano", ANO_LOA)
    .order("orgao_codigo")
    .order("unidade_codigo")
    .order("projeto_atividade_codigo")
    .order("elemento_codigo");
  if (error) throw new Error(error.message);
  return (data ?? []).map(paraLoaProjecao);
}

// Apaga tudo e reinsere a lista inteira — mesma convenção de
// importarContratos acima: a tela sempre manda o estado completo, mais
// simples e seguro que tentar diferenciar quais linhas mudaram.
export async function salvarLoaProjecao(linhas: NovaLoaLinha[]): Promise<LoaProjecao[]> {
  await exigirAdmin();
  const supabase = await createClient();

  const { error: erroExclusao } = await supabase.from("loa_projecoes").delete().eq("ano", ANO_LOA);
  if (erroExclusao) throw new Error(erroExclusao.message);

  if (linhas.length === 0) {
    revalidatePath("/provisionamento");
    return [];
  }

  const { data, error } = await supabase
    .from("loa_projecoes")
    .insert(linhas.map(paraLoaLinhaDb))
    .select("*")
    .order("orgao_codigo")
    .order("unidade_codigo")
    .order("projeto_atividade_codigo")
    .order("elemento_codigo");
  if (error) throw new Error(error.message);
  revalidatePath("/provisionamento");
  return (data ?? []).map(paraLoaProjecao);
}

// Valor total da proposta (o "teto" que o usuário define pra acompanhar,
// em tempo real, quanto já foi distribuído entre as dotações e quanto
// ainda cabe) — uma linha só por ano, migration 0057.
export async function obterValorTotalLoa(): Promise<number> {
  await exigirAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loa_configuracoes")
    .select("valor_total")
    .eq("ano", ANO_LOA)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.valor_total ?? 0;
}

export async function salvarValorTotalLoa(valor: number): Promise<number> {
  await exigirAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("loa_configuracoes")
    .upsert({ ano: ANO_LOA, valor_total: valor, atualizado_em: new Date().toISOString() }, { onConflict: "ano" })
    .select("valor_total")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Erro ao salvar o valor total da proposta.");
  revalidatePath("/provisionamento");
  return data.valor_total;
}
