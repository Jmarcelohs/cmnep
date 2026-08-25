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

  // RLS já restringe a leitura a admin/ordenador de despesa/servidor (ver
  // migration 0051).
  const { data: processo } = await supabase
    .from("processos_licitatorios")
    .select("numero_processo, ano")
    .eq("id", id)
    .single();

  if (!processo) {
    return NextResponse.json({ error: "Processo não encontrado" }, { status: 404 });
  }

  const filename = `Capa do Processo - ${String(processo.numero_processo).padStart(3, "0")}-${processo.ano}.pdf`;

  return gerarPdfDeRota(request, `/licitacoes/${id}/imprimir/capa`, filename);
}
