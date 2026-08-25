"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { sanitizarHtmlDocumento } from "@/lib/sanitizar-html";
import { montarParagrafoAberturaCapa } from "@/lib/licitacoes/documento-capa";
import type { Database } from "@/lib/supabase/database.types";
import type {
  DocumentoProcesso,
  ModalidadeProcesso,
  NovoProcesso,
  PessoaResumo,
  Processo,
  TipoDocumentoLicitacao,
} from "@/lib/licitacoes/tipos";
import type { DotacaoOrcamentaria } from "@/lib/suplementacoes/documento";

// Mesma sensibilidade combinada com o usuário: leitura/criação/edição pra
// admin, ordenador de despesa e servidor; exclusão só admin/ordenador (ver
// migration 0051, que já reforça isso via RLS — a checagem aqui é só pra
// dar uma mensagem de erro melhor do que o erro cru do Postgres).
async function exigirAcesso() {
  const usuario = await getCurrentUsuario();
  if (!usuario || !["admin", "ordenador_despesa", "servidor"].includes(usuario.papel)) {
    throw new Error("Acesso restrito à Secretaria/Compras.");
  }
  return usuario;
}

async function exigirAcessoExclusao() {
  const usuario = await getCurrentUsuario();
  if (!usuario || !["admin", "ordenador_despesa"].includes(usuario.papel)) {
    throw new Error("Só admin ou ordenador de despesa podem excluir um processo.");
  }
  return usuario;
}

const SELECT_COM_FICHA = "*, ficha:dotacoes_orcamentarias(*)";

type LinhaProcesso = Database["public"]["Tables"]["processos_licitatorios"]["Row"] & {
  ficha: DotacaoOrcamentaria | null;
};

function paraLinhaDb(dados: NovoProcesso) {
  return {
    numero_processo: dados.numeroProcesso,
    ano: dados.ano,
    modalidade: dados.modalidade,
    numero_modalidade: dados.numeroModalidade,
    data_abertura: dados.dataAbertura,
    objeto: dados.objeto,
    ficha_id: dados.fichaId,
    dotacao_subelemento: dados.dotacaoSubelemento,
    vinculo_pca: dados.vinculoPca,
    organizador_pessoa_id: dados.organizadorPessoaId,
    agente_contratacao_pessoa_id: dados.agenteContratacaoPessoaId,
  };
}

function paraProcesso(linha: LinhaProcesso): Processo & { ficha: DotacaoOrcamentaria | null } {
  return {
    id: linha.id,
    numeroProcesso: linha.numero_processo,
    ano: linha.ano,
    modalidade: linha.modalidade,
    numeroModalidade: linha.numero_modalidade,
    dataAbertura: linha.data_abertura,
    objeto: linha.objeto,
    fichaId: linha.ficha_id,
    dotacaoSubelemento: linha.dotacao_subelemento,
    vinculoPca: linha.vinculo_pca,
    organizadorPessoaId: linha.organizador_pessoa_id,
    agenteContratacaoPessoaId: linha.agente_contratacao_pessoa_id,
    criadoEm: linha.criado_em,
    ficha: linha.ficha,
  };
}

export async function listarProcessos() {
  await exigirAcesso();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processos_licitatorios")
    .select(SELECT_COM_FICHA)
    .order("ano", { ascending: false })
    .order("numero_processo", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as LinhaProcesso[]).map(paraProcesso);
}

export async function buscarProcesso(id: string) {
  await exigirAcesso();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processos_licitatorios")
    .select(SELECT_COM_FICHA)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return paraProcesso(data as unknown as LinhaProcesso);
}

export async function listarPessoasAtivas(): Promise<PessoaResumo[]> {
  await exigirAcesso();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pessoas")
    .select("id, nome, cargo, genero")
    .eq("ativo", true)
    .order("nome");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listarFichasAtivas(): Promise<DotacaoOrcamentaria[]> {
  await exigirAcesso();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("dotacoes_orcamentarias")
    .select("*")
    .eq("ativo", true)
    .order("ficha");
  if (error) throw new Error(error.message);
  return data ?? [];
}

// Próximos números sugeridos (procedimento geral do ano + dentro da
// modalidade escolhida) — só uma sugestão pro formulário, o usuário pode
// ajustar (unique constraint na migration 0051 barra duplicidade real).
export async function proximosNumerosSugeridos(ano: number, modalidade: ModalidadeProcesso) {
  await exigirAcesso();
  const supabase = await createClient();
  const [{ data: doAno }, { data: daModalidade }] = await Promise.all([
    supabase.from("processos_licitatorios").select("numero_processo").eq("ano", ano),
    supabase
      .from("processos_licitatorios")
      .select("numero_modalidade")
      .eq("ano", ano)
      .eq("modalidade", modalidade),
  ]);
  const maiorProcesso = (doAno ?? []).reduce((max, r) => Math.max(max, r.numero_processo), 0);
  const maiorModalidade = (daModalidade ?? []).reduce((max, r) => Math.max(max, r.numero_modalidade), 0);
  return { numeroProcesso: maiorProcesso + 1, numeroModalidade: maiorModalidade + 1 };
}

export async function criarProcesso(dados: NovoProcesso) {
  const usuario = await exigirAcesso();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processos_licitatorios")
    .insert({ ...paraLinhaDb(dados), criado_por: usuario!.id })
    .select(SELECT_COM_FICHA)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Erro ao salvar o processo.");
  revalidatePath("/licitacoes");
  return paraProcesso(data as unknown as LinhaProcesso);
}

export async function editarProcesso(id: string, dados: NovoProcesso) {
  await exigirAcesso();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processos_licitatorios")
    .update({ ...paraLinhaDb(dados), atualizado_em: new Date().toISOString() })
    .eq("id", id)
    .select(SELECT_COM_FICHA)
    .single();
  if (error || !data) throw new Error(error?.message ?? "Erro ao atualizar o processo.");
  revalidatePath("/licitacoes");
  revalidatePath(`/licitacoes/${id}`);
  return paraProcesso(data as unknown as LinhaProcesso);
}

export async function excluirProcesso(id: string) {
  await exigirAcessoExclusao();
  const supabase = await createClient();
  const { error } = await supabase.from("processos_licitatorios").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/licitacoes");
}

export async function listarDocumentos(processoId: string): Promise<DocumentoProcesso[]> {
  await exigirAcesso();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processos_licitatorios_documentos")
    .select("*")
    .eq("processo_id", processoId);
  if (error) throw new Error(error.message);
  return (data ?? []).map((d) => ({
    id: d.id,
    processoId: d.processo_id,
    tipo: d.tipo,
    corpoHtml: d.corpo_html,
    criadoEm: d.criado_em,
    atualizadoEm: d.atualizado_em,
  }));
}

// Gera (ou recupera, se já existir) o documento de um tipo — a Capa parte
// de um parágrafo de abertura auto-preenchido a partir do processo (ver
// montarParagrafoAberturaCapa), editável antes de imprimir.
export async function gerarDocumentoCapa(processoId: string): Promise<DocumentoProcesso> {
  const usuario = await exigirAcesso();
  const supabase = await createClient();

  const { data: existente } = await supabase
    .from("processos_licitatorios_documentos")
    .select("*")
    .eq("processo_id", processoId)
    .eq("tipo", "capa")
    .maybeSingle();

  if (existente) {
    return {
      id: existente.id,
      processoId: existente.processo_id,
      tipo: existente.tipo,
      corpoHtml: existente.corpo_html,
      criadoEm: existente.criado_em,
      atualizadoEm: existente.atualizado_em,
    };
  }

  const { data: processo } = await supabase
    .from("processos_licitatorios")
    .select("organizador_pessoa_id, agente_contratacao_pessoa_id")
    .eq("id", processoId)
    .single();

  const idsPessoas = [processo?.organizador_pessoa_id, processo?.agente_contratacao_pessoa_id].filter(
    (v): v is string => Boolean(v),
  );
  const { data: pessoas } = idsPessoas.length
    ? await supabase.from("pessoas").select("id, nome, cargo, genero").in("id", idsPessoas)
    : { data: [] as PessoaResumo[] };
  const porId = new Map((pessoas ?? []).map((p) => [p.id, p as PessoaResumo]));

  const corpoHtml = montarParagrafoAberturaCapa({
    organizador: processo?.organizador_pessoa_id ? (porId.get(processo.organizador_pessoa_id) ?? null) : null,
    agente: processo?.agente_contratacao_pessoa_id
      ? (porId.get(processo.agente_contratacao_pessoa_id) ?? null)
      : null,
  });

  const { data, error } = await supabase
    .from("processos_licitatorios_documentos")
    .insert({ processo_id: processoId, tipo: "capa", corpo_html: corpoHtml, criado_por: usuario!.id })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Erro ao gerar a capa do processo.");

  revalidatePath(`/licitacoes/${processoId}`);
  return {
    id: data.id,
    processoId: data.processo_id,
    tipo: data.tipo,
    corpoHtml: data.corpo_html,
    criadoEm: data.criado_em,
    atualizadoEm: data.atualizado_em,
  };
}

export async function salvarDocumento(
  processoId: string,
  tipo: TipoDocumentoLicitacao,
  corpoHtml: string,
) {
  await exigirAcesso();
  const supabase = await createClient();
  const html = sanitizarHtmlDocumento(corpoHtml);
  const { error } = await supabase
    .from("processos_licitatorios_documentos")
    .update({ corpo_html: html, atualizado_em: new Date().toISOString() })
    .eq("processo_id", processoId)
    .eq("tipo", tipo);
  if (error) throw new Error(error.message);
  revalidatePath(`/licitacoes/${processoId}`);
}
