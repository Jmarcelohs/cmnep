import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarPdfDeRota } from "@/lib/pdf/gerar-pdf";

export const maxDuration = 60;

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: documento } = await supabase
    .from("processos_licitatorios_documentos")
    .select("id")
    .eq("processo_id", id)
    .eq("tipo", "tr")
    .single();
  if (!documento) {
    return NextResponse.json({ error: "Termo de Referência não encontrado" }, { status: 404 });
  }

  return gerarPdfDeRota(request, `/licitacoes/${id}/imprimir/tr`, `Termo de Referência - ${id}.pdf`);
}
