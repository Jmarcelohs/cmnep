import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const BUCKET = "prestacoes-anexos";
const BUCKET_REEMBOLSO = "reembolso-anexos";
const URL_VALIDA_SEGUNDOS = 300;

export async function carregarAnexosParaImpressao(
  supabase: SupabaseClient<Database>,
  prestacaoId: string,
) {
  const { data: anexos } = await supabase
    .from("diarias_prestacoes_anexos")
    .select("caminho, nome_original, tipo")
    .eq("prestacao_id", prestacaoId)
    .order("criado_em");

  const imagens = (anexos ?? []).filter((a) => a.tipo === "imagem");
  const documentos = (anexos ?? [])
    .filter((a) => a.tipo !== "imagem")
    .map((a) => ({ nome: a.nome_original }));

  const fotos = await Promise.all(
    imagens.map(async (imagem) => {
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(imagem.caminho, URL_VALIDA_SEGUNDOS);
      return { url: data?.signedUrl ?? "", nome: imagem.nome_original };
    }),
  );

  return { fotos: fotos.filter((f) => f.url), documentos };
}

export async function baixarDocumentosPdfDiaria(
  supabase: SupabaseClient<Database>,
  prestacaoId: string,
) {
  const { data: anexos } = await supabase
    .from("diarias_prestacoes_anexos")
    .select("caminho")
    .eq("prestacao_id", prestacaoId)
    .eq("tipo", "pdf")
    .order("criado_em");

  const buffers = await Promise.all(
    (anexos ?? []).map(async (anexo) => {
      const { data, error } = await supabase.storage.from(BUCKET).download(anexo.caminho);
      if (error) {
        console.error(`Falha ao baixar anexo "${anexo.caminho}":`, error.message);
        return null;
      }
      return Buffer.from(await data.arrayBuffer());
    }),
  );

  return buffers.filter((b): b is NonNullable<typeof b> => b !== null);
}

export async function baixarComprovantesPdf(
  supabase: SupabaseClient<Database>,
  requerimentoId: string,
) {
  const { data: anexos } = await supabase
    .from("requerimentos_reembolso_anexos")
    .select("caminho")
    .eq("requerimento_id", requerimentoId)
    .eq("tipo", "pdf")
    .order("criado_em");

  const buffers = await Promise.all(
    (anexos ?? []).map(async (anexo) => {
      const { data, error } = await supabase.storage.from(BUCKET_REEMBOLSO).download(anexo.caminho);
      if (error) {
        console.error(`Falha ao baixar comprovante "${anexo.caminho}":`, error.message);
        return null;
      }
      return Buffer.from(await data.arrayBuffer());
    }),
  );

  return buffers.filter((b): b is NonNullable<typeof b> => b !== null);
}

export async function carregarAnexosReembolsoParaImpressao(
  supabase: SupabaseClient<Database>,
  requerimentoId: string,
) {
  const { data: anexos } = await supabase
    .from("requerimentos_reembolso_anexos")
    .select("caminho, nome_original, tipo")
    .eq("requerimento_id", requerimentoId)
    .order("criado_em");

  const imagens = (anexos ?? []).filter((a) => a.tipo === "imagem");
  const documentos = (anexos ?? [])
    .filter((a) => a.tipo !== "imagem")
    .map((a) => ({ nome: a.nome_original }));

  const fotos = await Promise.all(
    imagens.map(async (imagem) => {
      const { data } = await supabase.storage
        .from(BUCKET_REEMBOLSO)
        .createSignedUrl(imagem.caminho, URL_VALIDA_SEGUNDOS);
      return { url: data?.signedUrl ?? "", nome: imagem.nome_original };
    }),
  );

  return { fotos: fotos.filter((f) => f.url), documentos };
}
