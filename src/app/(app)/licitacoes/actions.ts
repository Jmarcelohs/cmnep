"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { sanitizarHtmlDocumento } from "@/lib/sanitizar-html";
import { montarParagrafoAberturaCapa } from "@/lib/licitacoes/documento-capa";
import { montarCorpoTR } from "@/lib/licitacoes/documento-tr";
import { montarCorpoDFD } from "@/lib/licitacoes/documento-dfd";
import { montarCorpoETP } from "@/lib/licitacoes/documento-etp";
import { montarCorpoCertidaoValor } from "@/lib/licitacoes/documento-certidao-valor";
import { montarParagrafoSolicitacaoCompra } from "@/lib/licitacoes/documento-solicitacao-compra";
import type { Database } from "@/lib/supabase/database.types";
import type {
  DocumentoProcesso,
  ItemProcesso,
  ModalidadeProcesso,
  NovoItemProcesso,
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
    pesquisa_precos_pessoa_id: dados.pesquisaPrecosPessoaId,
    gestor_contrato_pessoa_id: dados.gestorContratoPessoaId,
    fiscal_contrato_pessoa_id: dados.fiscalContratoPessoaId,
    tr_solucao_escolhida: dados.trSolucaoEscolhida,
    tr_natureza_execucao: dados.trNaturezaExecucao,
    tr_justificativa_natureza: dados.trJustificativaNatureza,
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
    pesquisaPrecosPessoaId: linha.pesquisa_precos_pessoa_id,
    gestorContratoPessoaId: linha.gestor_contrato_pessoa_id,
    fiscalContratoPessoaId: linha.fiscal_contrato_pessoa_id,
    trSolucaoEscolhida: linha.tr_solucao_escolhida,
    trNaturezaExecucao: linha.tr_natureza_execucao,
    trJustificativaNatureza: linha.tr_justificativa_natureza,
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

async function buscarDocumentoExistente(
  supabase: Awaited<ReturnType<typeof createClient>>,
  processoId: string,
  tipo: TipoDocumentoLicitacao,
): Promise<DocumentoProcesso | null> {
  const { data } = await supabase
    .from("processos_licitatorios_documentos")
    .select("*")
    .eq("processo_id", processoId)
    .eq("tipo", tipo)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    processoId: data.processo_id,
    tipo: data.tipo,
    corpoHtml: data.corpo_html,
    criadoEm: data.criado_em,
    atualizadoEm: data.atualizado_em,
  };
}

async function inserirDocumento(
  supabase: Awaited<ReturnType<typeof createClient>>,
  processoId: string,
  tipo: TipoDocumentoLicitacao,
  corpoHtml: string,
  criadoPor: string,
): Promise<DocumentoProcesso> {
  const { data, error } = await supabase
    .from("processos_licitatorios_documentos")
    .insert({ processo_id: processoId, tipo, corpo_html: corpoHtml, criado_por: criadoPor })
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Erro ao gerar o documento.");
  return {
    id: data.id,
    processoId: data.processo_id,
    tipo: data.tipo,
    corpoHtml: data.corpo_html,
    criadoEm: data.criado_em,
    atualizadoEm: data.atualizado_em,
  };
}

async function buscarItens(
  supabase: Awaited<ReturnType<typeof createClient>>,
  processoId: string,
): Promise<ItemProcesso[]> {
  const { data: itensRows } = await supabase
    .from("processos_licitatorios_itens")
    .select("*")
    .eq("processo_id", processoId)
    .order("numero_item");
  return (itensRows ?? []).map((i) => ({
    id: i.id,
    processoId: i.processo_id,
    numeroItem: i.numero_item,
    objeto: i.objeto,
    unidade: i.unidade,
    quantidade: Number(i.quantidade),
    valorUnitario: i.valor_unitario != null ? Number(i.valor_unitario) : null,
    valorGlobal: i.valor_global != null ? Number(i.valor_global) : null,
  }));
}

// O TR não é mais um blob editado livremente (ver migration 0053): as
// partes que variam por processo (solução escolhida, natureza da execução)
// vivem como campos estruturados no próprio processo, preenchidos pelo
// TrFormulario. Por isso o corpo_html é sempre recalculado a partir do
// estado atual do processo — nunca só recuperado de um cache — e como a
// Solicitação de Compra lê esse mesmo registro (tipo "tr"), o espelhamento
// entre os dois documentos acontece automaticamente.
async function regenerarCorpoTr(
  supabase: Awaited<ReturnType<typeof createClient>>,
  processoId: string,
  criadoPor: string,
): Promise<DocumentoProcesso> {
  const { data: processo } = await supabase
    .from("processos_licitatorios")
    .select(SELECT_COM_FICHA)
    .eq("id", processoId)
    .single();
  if (!processo) throw new Error("Processo não encontrado.");

  const itens = await buscarItens(supabase, processoId);

  const idsPessoas = [processo.gestor_contrato_pessoa_id, processo.fiscal_contrato_pessoa_id].filter(
    (v): v is string => Boolean(v),
  );
  const { data: pessoas } = idsPessoas.length
    ? await supabase.from("pessoas").select("id, nome, cargo, genero").in("id", idsPessoas)
    : { data: [] as PessoaResumo[] };
  const porId = new Map((pessoas ?? []).map((p) => [p.id, p as PessoaResumo]));

  const corpoHtml = montarCorpoTR({
    processo: paraProcesso(processo as unknown as LinhaProcesso),
    itens,
    ficha: (processo as unknown as LinhaProcesso).ficha,
    gestor: processo.gestor_contrato_pessoa_id ? (porId.get(processo.gestor_contrato_pessoa_id) ?? null) : null,
    fiscal: processo.fiscal_contrato_pessoa_id ? (porId.get(processo.fiscal_contrato_pessoa_id) ?? null) : null,
  });

  const { data, error } = await supabase
    .from("processos_licitatorios_documentos")
    .upsert(
      { processo_id: processoId, tipo: "tr", corpo_html: corpoHtml, criado_por: criadoPor },
      { onConflict: "processo_id,tipo" },
    )
    .select("*")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Erro ao gerar o Termo de Referência.");
  return {
    id: data.id,
    processoId: data.processo_id,
    tipo: data.tipo,
    corpoHtml: data.corpo_html,
    criadoEm: data.criado_em,
    atualizadoEm: data.atualizado_em,
  };
}

export async function gerarDocumentoTr(processoId: string): Promise<DocumentoProcesso> {
  const usuario = await exigirAcesso();
  const supabase = await createClient();
  const documento = await regenerarCorpoTr(supabase, processoId, usuario!.id);
  revalidatePath(`/licitacoes/${processoId}`);
  return documento;
}

// Salva os campos estruturados do TR (solução escolhida / natureza da
// execução / justificativa — preenchidos pelo TrFormulario) e regenera o
// corpo_html na mesma operação, já refletindo no documento "tr" e em
// qualquer Solicitação de Compra que o reaproveite.
export async function salvarCamposTr(
  processoId: string,
  dados: {
    trSolucaoEscolhida: string;
    trNaturezaExecucao: "continuada" | "nao_continuada";
    trJustificativaNatureza: string;
  },
): Promise<DocumentoProcesso> {
  const usuario = await exigirAcesso();
  const supabase = await createClient();

  const { error } = await supabase
    .from("processos_licitatorios")
    .update({
      tr_solucao_escolhida: dados.trSolucaoEscolhida,
      tr_natureza_execucao: dados.trNaturezaExecucao,
      tr_justificativa_natureza: dados.trJustificativaNatureza,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", processoId);
  if (error) throw new Error(error.message);

  const documento = await regenerarCorpoTr(supabase, processoId, usuario!.id);
  revalidatePath(`/licitacoes/${processoId}`);
  return documento;
}

// Gera (ou recupera) o DFD — objeto/itens/vínculo no PCA/data do processo
// (ver montarCorpoDFD); tipificação/tipo de material/prioridade já vêm
// marcados com o valor mais comum nesta Câmara, editável antes de imprimir.
export async function gerarDocumentoDfd(processoId: string): Promise<DocumentoProcesso> {
  const usuario = await exigirAcesso();
  const supabase = await createClient();

  const existente = await buscarDocumentoExistente(supabase, processoId, "dfd");
  if (existente) return existente;

  const { data: processo } = await supabase
    .from("processos_licitatorios")
    .select("*")
    .eq("id", processoId)
    .single();
  if (!processo) throw new Error("Processo não encontrado.");

  const itens = await buscarItens(supabase, processoId);

  const corpoHtml = montarCorpoDFD({
    processo: paraProcesso({ ...processo, ficha: null } as unknown as LinhaProcesso),
    itens,
  });

  const documento = await inserirDocumento(supabase, processoId, "dfd", corpoHtml, usuario!.id);
  revalidatePath(`/licitacoes/${processoId}`);
  return documento;
}

// Gera (ou recupera) o ETP — objeto/itens/vínculo no PCA/data do processo
// (ver montarCorpoETP); as seções narrativas (necessidade, levantamento de
// mercado, solução escolhida) ficam como ponto de partida editável, já que
// variam por processo.
export async function gerarDocumentoEtp(processoId: string): Promise<DocumentoProcesso> {
  const usuario = await exigirAcesso();
  const supabase = await createClient();

  const existente = await buscarDocumentoExistente(supabase, processoId, "etp");
  if (existente) return existente;

  const { data: processo } = await supabase
    .from("processos_licitatorios")
    .select("*")
    .eq("id", processoId)
    .single();
  if (!processo) throw new Error("Processo não encontrado.");

  const itens = await buscarItens(supabase, processoId);

  const { data: pesquisaPrecos } = processo.pesquisa_precos_pessoa_id
    ? await supabase
        .from("pessoas")
        .select("id, nome, cargo, genero")
        .eq("id", processo.pesquisa_precos_pessoa_id)
        .single()
    : { data: null as PessoaResumo | null };

  const corpoHtml = montarCorpoETP({
    processo: paraProcesso({ ...processo, ficha: null } as unknown as LinhaProcesso),
    itens,
    pesquisaPrecos,
  });

  const documento = await inserirDocumento(supabase, processoId, "etp", corpoHtml, usuario!.id);
  revalidatePath(`/licitacoes/${processoId}`);
  return documento;
}

// Gera (ou recupera) a Certidão de Valor — assinada pela Diretoria de
// Tesouraria e Financeiro (ver DIRETORA_TESOURARIA, documento-comum.ts),
// certifica o limite de dispensa por valor do art. 75, §1º da Lei
// 14.133/2021. Só precisa do objeto/modalidade/data do processo, já
// disponíveis sem consulta extra.
export async function gerarDocumentoCertidaoValor(processoId: string): Promise<DocumentoProcesso> {
  const usuario = await exigirAcesso();
  const supabase = await createClient();

  const existente = await buscarDocumentoExistente(supabase, processoId, "certidao_valor");
  if (existente) return existente;

  const { data: processo } = await supabase
    .from("processos_licitatorios")
    .select("*")
    .eq("id", processoId)
    .single();
  if (!processo) throw new Error("Processo não encontrado.");

  const corpoHtml = montarCorpoCertidaoValor({
    processo: paraProcesso({ ...processo, ficha: null } as unknown as LinhaProcesso),
  });

  const documento = await inserirDocumento(supabase, processoId, "certidao_valor", corpoHtml, usuario!.id);
  revalidatePath(`/licitacoes/${processoId}`);
  return documento;
}

// Gera (ou recupera) a Solicitação de Compra — o pacote impresso embute o
// TR junto (ver solicitacao-compra-conteudo.tsx), então gerar esse
// documento também garante que o TR exista (reaproveitado, não duplicado).
export async function gerarDocumentoSolicitacaoCompra(processoId: string): Promise<DocumentoProcesso> {
  const usuario = await exigirAcesso();
  const supabase = await createClient();

  await gerarDocumentoTr(processoId);

  const existente = await buscarDocumentoExistente(supabase, processoId, "solicitacao_compra");
  if (existente) return existente;

  const { data: processo } = await supabase
    .from("processos_licitatorios")
    .select("objeto")
    .eq("id", processoId)
    .single();
  if (!processo) throw new Error("Processo não encontrado.");

  const corpoHtml = montarParagrafoSolicitacaoCompra({
    processo: { objeto: processo.objeto } as Processo,
  });

  const documento = await inserirDocumento(supabase, processoId, "solicitacao_compra", corpoHtml, usuario!.id);
  revalidatePath(`/licitacoes/${processoId}`);
  return documento;
}

export async function listarItens(processoId: string): Promise<ItemProcesso[]> {
  await exigirAcesso();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processos_licitatorios_itens")
    .select("*")
    .eq("processo_id", processoId)
    .order("numero_item");
  if (error) throw new Error(error.message);
  return (data ?? []).map((i) => ({
    id: i.id,
    processoId: i.processo_id,
    numeroItem: i.numero_item,
    objeto: i.objeto,
    unidade: i.unidade,
    quantidade: Number(i.quantidade),
    valorUnitario: i.valor_unitario != null ? Number(i.valor_unitario) : null,
    valorGlobal: i.valor_global != null ? Number(i.valor_global) : null,
  }));
}

// Substitui todos os itens do processo pelos da lista — mais simples que
// diferenciar quais linhas mudaram (mesma convenção já usada em
// importarContratos, ver actions.ts do Provisionamento).
export async function salvarItens(processoId: string, itens: NovoItemProcesso[]): Promise<ItemProcesso[]> {
  await exigirAcesso();
  const supabase = await createClient();

  const { error: erroExclusao } = await supabase
    .from("processos_licitatorios_itens")
    .delete()
    .eq("processo_id", processoId);
  if (erroExclusao) throw new Error(erroExclusao.message);

  revalidatePath(`/licitacoes/${processoId}`);
  if (itens.length === 0) return [];

  const { data, error } = await supabase
    .from("processos_licitatorios_itens")
    .insert(
      itens.map((i) => ({
        processo_id: processoId,
        numero_item: i.numeroItem,
        objeto: i.objeto,
        unidade: i.unidade,
        quantidade: i.quantidade,
        valor_unitario: i.valorUnitario,
        valor_global: i.valorGlobal,
      })),
    )
    .select("*")
    .order("numero_item");
  if (error) throw new Error(error.message);
  return (data ?? []).map((i) => ({
    id: i.id,
    processoId: i.processo_id,
    numeroItem: i.numero_item,
    objeto: i.objeto,
    unidade: i.unidade,
    quantidade: Number(i.quantidade),
    valorUnitario: i.valor_unitario != null ? Number(i.valor_unitario) : null,
    valorGlobal: i.valor_global != null ? Number(i.valor_global) : null,
  }));
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
