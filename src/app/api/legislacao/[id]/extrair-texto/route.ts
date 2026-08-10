import { NextRequest, NextResponse } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";

// unpdf, não pdfjs-dist direto: o pdf.js "puro" carrega seu worker via
// import() de um arquivo separado (pdf.worker.mjs) em runtime — sob o
// Turbopack (Next 16) esse caminho vem quebrado ("Setting up fake worker
// failed"), reproduzido tanto em dev quanto com o pacote marcado como
// externo. unpdf embute o worker no próprio bundle (feito pra rodar em
// serverless/edge), sem esse problema.
async function extrairTextoPdf(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

// Extrai o texto de um documento de legislação já enviado (só PDF, por
// enquanto) e grava em conteudo_texto, pra entrar na busca por palavras
// dentro do arquivo. Chamada pelo cliente logo após o upload
// (documentos-form.tsx) — falha aqui não desfaz o upload, só deixa o
// documento sem essa busca por conteúdo (ainda buscável por título/
// descrição/número).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const usuario = await getCurrentUsuario();
  if (!usuario || (usuario.papel !== "ordenador_despesa" && usuario.papel !== "admin")) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const supabase = await createClient();

  const { data: documento } = await supabase
    .from("legislacao_documentos")
    .select("caminho, tipo_arquivo")
    .eq("id", id)
    .maybeSingle();

  if (!documento) {
    return NextResponse.json({ error: "Documento não encontrado" }, { status: 404 });
  }

  if (documento.tipo_arquivo !== "pdf") {
    return NextResponse.json({ ok: true, extraido: false });
  }

  const { data: arquivo, error: erroDownload } = await supabase.storage
    .from("legislacao-documentos")
    .download(documento.caminho);

  if (erroDownload || !arquivo) {
    return NextResponse.json({ error: "Não foi possível baixar o arquivo" }, { status: 500 });
  }

  try {
    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    const texto = await extrairTextoPdf(bytes);

    await supabase
      .from("legislacao_documentos")
      .update({ conteudo_texto: texto })
      .eq("id", id);

    return NextResponse.json({ ok: true, extraido: true });
  } catch {
    return NextResponse.json({ error: "Não foi possível extrair o texto do PDF" }, { status: 500 });
  }
}
