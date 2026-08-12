import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarPdfDeRota } from "@/lib/pdf/gerar-pdf";
import { baixarAnexosOficioDEPdf } from "@/lib/pdf/anexos";

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

  // RLS já restringe a leitura da tabela a admin (ver migration 0043) — sem
  // permissão, a query volta vazia e cai no 404 abaixo, sem vazar se o
  // ofício existe.
  const { data: oficio } = await supabase
    .from("oficios_diretor_executivo")
    .select("numero, ano, assunto")
    .eq("id", id)
    .single();

  if (!oficio) {
    return NextResponse.json({ error: "Ofício não encontrado" }, { status: 404 });
  }

  const filename = `Ofício nº ${oficio.numero}-${oficio.ano}-DE - ${limparNomeArquivo(oficio.assunto)}.pdf`;

  const pdfsParaAnexar = await baixarAnexosOficioDEPdf(supabase, id);

  return gerarPdfDeRota(request, `/oficios-de/${id}/imprimir`, filename, pdfsParaAnexar);
}
