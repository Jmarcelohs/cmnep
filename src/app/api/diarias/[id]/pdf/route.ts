import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gerarPdfDeRota } from "@/lib/pdf/gerar-pdf";

export const maxDuration = 60;

// Remove caracteres proibidos em nome de arquivo no Windows/macOS/Linux.
function limparNomeArquivo(texto: string): string {
  return texto.replace(/[\\/:*?"<>|]/g, "-").trim();
}

// "2026-07-28" -> "28_07_2026"
function formatarDataArquivo(data: string): string {
  const [ano, mes, dia] = data.split("-");
  return `${dia}_${mes}_${ano}`;
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

  const { data: solicitacao } = await supabase
    .from("diarias_solicitacoes")
    .select(
      "numero_solicitacao, municipio_destino, uf_destino, data_partida, data_chegada, pessoas(nome)",
    )
    .eq("id", id)
    .single();

  if (!solicitacao) {
    return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 });
  }

  const pessoa = solicitacao.pessoas as unknown as { nome: string } | null;

  let periodo: string | null = null;
  if (solicitacao.data_partida && solicitacao.data_chegada) {
    periodo = `${formatarDataArquivo(solicitacao.data_partida)}_a_${formatarDataArquivo(solicitacao.data_chegada)}`;
  } else if (solicitacao.data_partida) {
    periodo = formatarDataArquivo(solicitacao.data_partida);
  }

  const partes = [
    solicitacao.numero_solicitacao ? `Nº${solicitacao.numero_solicitacao}` : null,
    "Solicitação de Diária",
    "Anexo I",
    pessoa?.nome ? limparNomeArquivo(pessoa.nome) : null,
    solicitacao.municipio_destino ? limparNomeArquivo(solicitacao.municipio_destino) : null,
    solicitacao.uf_destino ? limparNomeArquivo(solicitacao.uf_destino) : null,
    periodo,
  ].filter(Boolean);

  const filename = `${partes.join("_")}.pdf`;

  return gerarPdfDeRota(request, `/diarias/${id}/imprimir`, filename);
}
