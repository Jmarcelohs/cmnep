import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buscarSuplementacaoCompleta } from "@/lib/suplementacoes/dados";
import { gerarDocxDecreto } from "@/lib/suplementacoes/gerar-docx";
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

  const dados = await buscarSuplementacaoCompleta(supabase, id);
  if (!dados) {
    return NextResponse.json({ error: "Suplementação não encontrada" }, { status: 404 });
  }
  const { suplementacao, itensDestino, itensOrigem } = dados;

  try {
    const logoRes = await fetch(new URL("/timbrado/logo.png", request.url));
    const logoBuffer = Buffer.from(await logoRes.arrayBuffer());

    const buffer = await gerarDocxDecreto({
      numeroDecreto: suplementacao.numero_decreto || "___",
      dataDecreto: suplementacao.data_decreto || suplementacao.data_ato,
      corpoHtml: suplementacao.corpo_decreto_html,
      itensDestino,
      itensOrigem,
      logoBuffer,
    });
    const filename = `Decreto - ${suplementacao.numero_decreto ?? suplementacao.data_ato}.docx`;

    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": cabecalhoContentDisposition(filename, "docx"),
      },
    });
  } catch (error) {
    console.error("Erro ao gerar .docx do Decreto", error);
    return NextResponse.json({ error: "Não foi possível gerar o arquivo .docx" }, { status: 500 });
  }
}
