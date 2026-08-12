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

  // RLS já restringe a leitura a admin (ver migration 0046).
  const { data: suplementacao } = await supabase
    .from("suplementacoes_orcamentarias")
    .select("data_ato")
    .eq("id", id)
    .single();

  if (!suplementacao) {
    return NextResponse.json({ error: "Suplementação não encontrada" }, { status: 404 });
  }

  const filename = `Ato da Mesa Diretora - ${suplementacao.data_ato}.pdf`;

  return gerarPdfDeRota(request, `/suplementacoes/${id}/imprimir/ato`, filename);
}
