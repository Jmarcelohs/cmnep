import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarPdfDeRota, slugify } from "@/lib/pdf/gerar-pdf";
import { baixarComprovantesPdf } from "@/lib/pdf/anexos";

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

  const { data: requerimento } = await supabase
    .from("requerimentos_reembolso")
    .select("protocolo, pessoas(nome)")
    .eq("id", id)
    .single();

  if (!requerimento) {
    return NextResponse.json({ error: "Requerimento não encontrado" }, { status: 404 });
  }

  const pessoa = requerimento.pessoas as unknown as { nome: string } | null;
  const partes = ["requerimento", slugify(requerimento.protocolo)];
  if (pessoa?.nome) partes.push(slugify(pessoa.nome));
  const filename = `${partes.join("-").toLowerCase()}.pdf`;

  const pdfsParaAnexar = await baixarComprovantesPdf(supabase, id);

  return gerarPdfDeRota(request, `/requerimentos/${id}/imprimir`, filename, pdfsParaAnexar);
}
