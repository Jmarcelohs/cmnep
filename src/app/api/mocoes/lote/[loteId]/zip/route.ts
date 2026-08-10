import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";
import { renderizarPdfsDeRotas, slugify } from "@/lib/pdf/gerar-pdf";

// Um lote pode ter várias moções, cada uma renderizada num navegador
// Chromium — mais generoso que o das rotas de PDF individuais (60s) pra
// não estourar em lotes maiores.
export const maxDuration = 120;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ loteId: string }> },
) {
  const { loteId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: mocoes } = await supabase
    .from("mocoes")
    .select("id, tipo, destinatario")
    .eq("lote_id", loteId)
    .order("destinatario");

  if (!mocoes || mocoes.length === 0) {
    return NextResponse.json({ error: "Lote não encontrado" }, { status: 404 });
  }

  let buffers: Buffer[];
  try {
    buffers = await renderizarPdfsDeRotas(
      request,
      mocoes.map((m) => ({
        caminhoInterno: `/mocoes/${m.id}/imprimir`,
        paisagem: m.tipo === "congratulacoes",
      })),
    );
  } catch {
    return NextResponse.json(
      { error: "Não foi possível gerar os PDFs do lote" },
      { status: 502 },
    );
  }

  const zip = new JSZip();
  mocoes.forEach((m, i) => {
    const nome = `${String(i + 1).padStart(2, "0")} - ${slugify(m.destinatario)}.pdf`;
    zip.file(nome, buffers[i]);
  });

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(Buffer.from(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="mocoes-${loteId}.zip"`,
    },
  });
}
