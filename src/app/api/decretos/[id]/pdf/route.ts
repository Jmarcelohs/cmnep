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

  const { data: decreto } = await supabase
    .from("decretos_titulo_honorario")
    .select("numero, ano, nome_homenageado")
    .eq("id", id)
    .single();

  if (!decreto) {
    return NextResponse.json({ error: "Decreto não encontrado" }, { status: 404 });
  }

  const filename = `Decreto Legislativo nº ${decreto.numero}-${decreto.ano} - Título de Cidadão Honorário - ${limparNomeArquivo(decreto.nome_homenageado)}.pdf`;

  return gerarPdfDeRota(request, `/decretos/${id}/imprimir`, filename);
}
