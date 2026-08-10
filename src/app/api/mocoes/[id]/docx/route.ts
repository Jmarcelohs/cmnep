import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buscarMocaoCompleta } from "@/lib/mocoes/dados-completos";
import { gerarDocxMocao } from "@/lib/mocoes/gerar-docx";

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

  const dados = await buscarMocaoCompleta(supabase, id);
  if (!dados) {
    return NextResponse.json({ error: "Moção não encontrada" }, { status: 404 });
  }
  const { mocao, autor, associados, assinaturasPorId } = dados;

  try {
    const logoRes = await fetch(new URL("/timbrado/logo.png", request.url));
    const logoBuffer = Buffer.from(await logoRes.arrayBuffer());

    const buffer = await gerarDocxMocao({ mocao, autor, associados, assinaturasPorId, logoBuffer });
    const filename = `Moção - ${limparNomeArquivo(mocao.destinatario)} - ${mocao.data_mocao}.docx`;

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Erro ao gerar .docx da moção", error);
    return NextResponse.json({ error: "Não foi possível gerar o arquivo .docx" }, { status: 500 });
  }
}
