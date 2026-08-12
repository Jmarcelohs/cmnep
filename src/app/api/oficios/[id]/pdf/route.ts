import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarPdfDeRota } from "@/lib/pdf/gerar-pdf";
import { baixarAnexosOficioPdf } from "@/lib/pdf/anexos";

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

  const { data: oficio } = await supabase
    .from("oficios")
    .select("numero, ano, assunto")
    .eq("id", id)
    .single();

  if (!oficio) {
    return NextResponse.json({ error: "Ofício não encontrado" }, { status: 404 });
  }

  const filename = `Ofício nº ${oficio.numero}-${oficio.ano} - ${limparNomeArquivo(oficio.assunto)}.pdf`;

  const pdfsParaAnexar = await baixarAnexosOficioPdf(supabase, id);

  return gerarPdfDeRota(request, `/oficios/${id}/imprimir`, filename, pdfsParaAnexar);
}
