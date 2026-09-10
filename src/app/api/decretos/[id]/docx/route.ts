import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarDocxDecretoTituloHonorario } from "@/lib/decretos/gerar-docx";
import { cabecalhoContentDisposition } from "@/lib/pdf/gerar-pdf";

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

  const { data: decreto } = await supabase
    .from("decretos_titulo_honorario")
    .select("*")
    .eq("id", id)
    .single();
  if (!decreto) {
    return NextResponse.json({ error: "Decreto não encontrado" }, { status: 404 });
  }

  try {
    const logoRes = await fetch(new URL("/timbrado/logo.png", request.url));
    const logoBuffer = Buffer.from(await logoRes.arrayBuffer());

    let fotoBuffer: Buffer | null = null;
    if (decreto.foto_caminho) {
      const { data: fotoBlob } = await supabase.storage
        .from("decretos-fotos")
        .download(decreto.foto_caminho);
      if (fotoBlob) fotoBuffer = Buffer.from(await fotoBlob.arrayBuffer());
    }

    const buffer = await gerarDocxDecretoTituloHonorario({ decreto, logoBuffer, fotoBuffer });
    const filename = `decreto-titulo-honorario-${decreto.numero}-${decreto.ano}.docx`;

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": cabecalhoContentDisposition(filename, "docx"),
      },
    });
  } catch (error) {
    console.error("Erro ao gerar .docx do Decreto de Título de Cidadão Honorário", error);
    return NextResponse.json({ error: "Não foi possível gerar o arquivo .docx" }, { status: 500 });
  }
}
