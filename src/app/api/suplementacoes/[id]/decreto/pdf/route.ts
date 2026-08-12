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

  const { data: suplementacao } = await supabase
    .from("suplementacoes_orcamentarias")
    .select("data_ato, numero_decreto")
    .eq("id", id)
    .single();

  if (!suplementacao) {
    return NextResponse.json({ error: "Suplementação não encontrada" }, { status: 404 });
  }

  const filename = suplementacao.numero_decreto
    ? `Decreto ${suplementacao.numero_decreto} - Suplementação.pdf`
    : `Decreto de Suplementação - ${suplementacao.data_ato}.pdf`;

  return gerarPdfDeRota(request, `/suplementacoes/${id}/imprimir/decreto`, filename);
}
