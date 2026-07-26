import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderizarPdfDaRota, intercalarPdfs, slugify } from "@/lib/pdf/gerar-pdf";
import {
  baixarComprovantesPdf,
  carregarAnexosParaImpressao,
  carregarAnexosReembolsoParaImpressao,
} from "@/lib/pdf/anexos";
import { contarPaginasFotos } from "@/lib/pdf/paginacao";

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
  const partes = ["anexo-i-e-ii"];
  if (prestacao.numero_solicitacao) partes.push(`solicitacao-${slugify(prestacao.numero_solicitacao)}`);
  if (pessoa?.nome) partes.push(slugify(pessoa.nome));
  const filename = `${partes.join("-").toLowerCase()}.pdf`;

  const { data: requerimentos } = await supabase
    .from("requerimentos_reembolso")
    .select("id")
    .eq("solicitacao_diaria_id", id)
    .order("criado_em");

  // Precisa saber exatamente quantas páginas o Anexo I, o Anexo II e cada
  // requerimento (com sua própria seção de comprovantes) vão ocupar no PDF
  // renderizado, pra intercalar os comprovantes em PDF de cada requerimento
  // logo depois da seção dele — em vez de jogar todos juntos no final do
  // arquivo, longe de onde pertencem.
  const { documentos: documentosDiaria, fotos: fotosDiaria } = await carregarAnexosParaImpressao(
    supabase,
    prestacao.id,
  );

  let paginaAtual = 1; // Anexo I: sempre 1 página
  paginaAtual += 2 + contarPaginasFotos(fotosDiaria.length, documentosDiaria.length, true); // Anexo II

  const insercoes: { aposPagina: number; pdfs: Buffer[] }[] = [];

  for (const requerimento of requerimentos ?? []) {
    const [{ fotos, documentos }, pdfsDoRequerimento] = await Promise.all([
      carregarAnexosReembolsoParaImpressao(supabase, requerimento.id),
      baixarComprovantesPdf(supabase, requerimento.id),
    ]);

    paginaAtual += 1; // página do próprio requerimento
    paginaAtual += contarPaginasFotos(fotos.length, documentos.length);

    if (pdfsDoRequerimento.length > 0) {
      insercoes.push({ aposPagina: paginaAtual - 1, pdfs: pdfsDoRequerimento });
    }
  }

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderizarPdfDaRota(
      request,
      `/diarias/${id}/prestacao-contas/imprimir-completo`,
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível renderizar o documento" },
      { status: 502 },
    );
  }

  pdfBuffer = await intercalarPdfs(pdfBuffer, insercoes);

  return new NextResponse(Buffer.from(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
