import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarPdfDeRota } from "@/lib/pdf/gerar-pdf";

export const maxDuration = 60;

function limparNomeArquivo(texto: string): string {
  return texto.replace(/[\\/:*?"<>|]/g, "-").trim();
}

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

  const { data: mocao } = await supabase
    .from("mocoes")
    .select("tipo, destinatario, data_mocao")
    .eq("id", id)
    .single();

  if (!mocao) {
    return NextResponse.json({ error: "Moção não encontrada" }, { status: 404 });
  }

  const filename = `Moção - ${limparNomeArquivo(mocao.destinatario)} - ${mocao.data_mocao}.pdf`;

  return gerarPdfDeRota(request, `/mocoes/${id}/imprimir`, filename);
}
