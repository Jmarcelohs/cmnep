import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../../print-button";
import { MocaoConteudo } from "../../mocao-conteudo";
import { associadosComPresidenteObrigatorio, type VereadorSignatario } from "@/lib/mocoes/documento";

const BUCKET = "vereadores-assinaturas";

export default async function ImprimirMocaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: mocao } = await supabase.from("mocoes").select("*").eq("id", id).single();
  if (!mocao) notFound();

  const idsVereadores = [mocao.autor_vereador_id, ...mocao.associados_vereadores_ids];
  // Busca em duas queries — vereadores do lote + o Presidente atual — em
  // vez de uma só, já que ele pode não estar entre os ids salvos na
  // moção (ver associadosComPresidenteObrigatorio abaixo).
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
  const paraSignatario = (id: string): VereadorSignatario | null => {
    const v = porId.get(id);
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
  if (!autor) notFound();
  const associadosSalvos = mocao.associados_vereadores_ids
    .map(paraSignatario)
    .filter((v): v is VereadorSignatario => Boolean(v));
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

  const notaPapel =
    mocao.tipo === "congratulacoes"
      ? "Papel fotográfico glossy 230g, paisagem (A4 deitado)"
      : "Papel sulfite A4 90g, retrato";

  return (
    <>
      <div className="no-print fixed left-6 top-6 max-w-xs rounded-md bg-white px-3 py-2 text-xs text-slate-600 shadow-lg">
        Imprimir em: <strong>{notaPapel}</strong>
      </div>
      <PrintButton url={`/api/mocoes/${id}/pdf`} nomeArquivoPadrao={`mocao-${id}.pdf`} />
      <MocaoConteudo mocao={mocao} autor={autor} associados={associados} assinaturasPorId={assinaturasPorId} />
    </>
  );
}
