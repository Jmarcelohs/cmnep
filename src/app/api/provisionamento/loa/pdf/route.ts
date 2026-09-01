import { NextRequest, NextResponse } from "next/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { gerarPdfDeRota } from "@/lib/pdf/gerar-pdf";

export const maxDuration = 60;

// Sem [id] — a Proposta LOA 2027 é uma coleção só (ano fixo, ver
// provisionamento/actions.ts), não um registro individual. Confere o
// papel diretamente (mesmo padrão de /api/auditoria/csv) em vez de só
// checar autenticação, já que não há um registro específico pra RLS
// restringir implicitamente.
export async function GET(request: NextRequest) {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  return gerarPdfDeRota(request, "/provisionamento/loa/imprimir", "proposta-loa-2027.pdf");
}
