import type { SupabaseClient } from "@supabase/supabase-js";
import { associadosComPresidenteObrigatorio, type VereadorSignatario } from "./documento";
import type { Database } from "@/lib/supabase/database.types";

const BUCKET = "vereadores-assinaturas";

export type MocaoCompleta = {
  mocao: {
    id: string;
    tipo: Database["public"]["Tables"]["mocoes"]["Row"]["tipo"];
    data_mocao: string;
    destinatario: string;
    destinatario_tratamento: Database["public"]["Tables"]["mocoes"]["Row"]["destinatario_tratamento"];
    justificativa: string;
  };
  autor: VereadorSignatario;
  associados: VereadorSignatario[];
  // URL assinada (Storage) por id de vereador — null se ainda não tem
  // assinatura cadastrada (ver /vereadores).
  assinaturasPorId: Record<string, string | null>;
};

// Busca a moção + todos os dados pra renderizá-la (autor, associados, o
// Presidente obrigatório e as URLs assinadas das assinaturas) — usado
// tanto pela página de impressão (PDF) quanto pela geração de .docx, pra
// nunca divergirem em quem assina.
export async function buscarMocaoCompleta(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- cliente Supabase tipado genericamente pra aceitar tanto o client de servidor quanto o admin
  supabase: SupabaseClient<any>,
  id: string,
): Promise<MocaoCompleta | null> {
  const { data: mocao } = await supabase.from("mocoes").select("*").eq("id", id).single();
  if (!mocao) return null;

  const idsVereadores = [mocao.autor_vereador_id, ...mocao.associados_vereadores_ids];
  const [{ data: vereadores }, { data: presidenteAtual }] = await Promise.all([
    supabase
      .from("vereadores")
      .select("id, nome, partido, genero, presidente, assinatura_caminho")
      .in("id", idsVereadores),
    supabase
      .from("vereadores")
      .select("id, nome, partido, genero, presidente, assinatura_caminho")
      .eq("presidente", true)
      .maybeSingle(),
  ]);

  const porId = new Map((vereadores ?? []).map((v) => [v.id, v]));
  const paraSignatario = (idVereador: string): VereadorSignatario | null => {
    const v = porId.get(idVereador);
    if (!v) return null;
    return {
      id: v.id,
      nome: v.nome,
      partido: v.partido,
      genero: v.genero,
      presidente: v.presidente,
      assinaturaCaminho: v.assinatura_caminho,
    };
  };

  const autor = paraSignatario(mocao.autor_vereador_id);
  if (!autor) return null;

  const associadosSalvos = mocao.associados_vereadores_ids
    .map(paraSignatario)
    .filter((v: VereadorSignatario | null): v is VereadorSignatario => Boolean(v));

  // O Presidente assina toda moção por exigência do Regimento Interno,
  // mesmo quando não foi selecionado como autor/associado ao criá-la.
  const associados = associadosComPresidenteObrigatorio(
    autor,
    associadosSalvos,
    presidenteAtual
      ? {
          id: presidenteAtual.id,
          nome: presidenteAtual.nome,
          partido: presidenteAtual.partido,
          genero: presidenteAtual.genero,
          presidente: presidenteAtual.presidente,
          assinaturaCaminho: presidenteAtual.assinatura_caminho,
        }
      : null,
  );

  const assinaturasPorId: Record<string, string | null> = {};
  await Promise.all(
    [autor, ...associados].map(async (v) => {
      if (!v.assinaturaCaminho) {
        assinaturasPorId[v.id] = null;
        return;
      }
      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(v.assinaturaCaminho, 300);
      assinaturasPorId[v.id] = data?.signedUrl ?? null;
    }),
  );

  return { mocao, autor, associados, assinaturasPorId };
}
