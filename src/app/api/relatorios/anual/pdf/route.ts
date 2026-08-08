import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarPdfDeRota } from "@/lib/pdf/gerar-pdf";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const ano = Number(request.nextUrl.searchParams.get("ano")) || new Date().getFullYear();

  return gerarPdfDeRota(request, `/relatorios/anual/imprimir?ano=${ano}`, `relatorio-anual-${ano}.pdf`);
}
