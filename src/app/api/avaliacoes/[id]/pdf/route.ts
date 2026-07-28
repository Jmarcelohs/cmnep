import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarPdfDeRota } from "@/lib/pdf/gerar-pdf";

export const maxDuration = 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: avaliacao } = await supabase
    .from("avaliacoes")
    .select("ano, periodo, pessoas(nome)")
    .eq("id", id)
    .single();

  if (!avaliacao) {
    return NextResponse.json({ error: "Avaliação não encontrada" }, { status: 404 });
  }

  const pessoa = avaliacao.pessoas as unknown as { nome: string } | null;
  const filename = `avaliacao-${pessoa?.nome ?? id}-${avaliacao.periodo}-${avaliacao.ano}.pdf`;

  return gerarPdfDeRota(request, `/avaliacoes/${id}/imprimir`, filename);
}
