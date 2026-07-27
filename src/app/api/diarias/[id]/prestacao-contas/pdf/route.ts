import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarPdfDeRota, slugify } from "@/lib/pdf/gerar-pdf";
import { baixarDocumentosPdfDiaria } from "@/lib/pdf/anexos";

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

  const { data: prestacao } = await supabase
    .from("diarias_prestacoes_contas")
    .select("id, numero_solicitacao, pessoas(nome)")
    .eq("solicitacao_id", id)
    .single();

  if (!prestacao) {
    return NextResponse.json({ error: "Prestação de contas não encontrada" }, { status: 404 });
  }

  const pessoa = prestacao.pessoas as unknown as { nome: string } | null;
  const partes = ["anexo-ii"];
  if (prestacao.numero_solicitacao) partes.push(`solicitacao-${slugify(prestacao.numero_solicitacao)}`);
  if (pessoa?.nome) partes.push(slugify(pessoa.nome));
  const filename = `${partes.join("-").toLowerCase()}.pdf`;

  const pdfsParaAnexar = await baixarDocumentosPdfDiaria(supabase, prestacao.id);

  return gerarPdfDeRota(
    request,
    `/diarias/${id}/prestacao-contas/imprimir`,
    filename,
    pdfsParaAnexar,
  );
}
