import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintButton } from "../../../print-button";
import { MocaoConteudo } from "../../mocao-conteudo";
import type { VereadorSignatario } from "@/lib/mocoes/documento";

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
  const { data: vereadores } = await supabase
    .from("vereadores")
    .select("id, nome, partido, genero, presidente, assinatura_caminho")
    .in("id", idsVereadores);

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
  const associados = mocao.associados_vereadores_ids
    .map(paraSignatario)
    .filter((v): v is VereadorSignatario => Boolean(v));

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

  return (
    <>
      <PrintButton url={`/api/mocoes/${id}/pdf`} nomeArquivoPadrao={`mocao-${id}.pdf`} />
      <MocaoConteudo mocao={mocao} autor={autor} associados={associados} assinaturasPorId={assinaturasPorId} />
    </>
  );
}
