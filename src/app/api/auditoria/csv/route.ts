import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { OPERACAO_LABEL, TABELA_LABEL, camposAlterados, tituloRegistro } from "@/lib/auditoria/formato";

function csvEscape(valor: string) {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export async function GET(request: NextRequest) {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const supabase = await createClient();

  const tabela = request.nextUrl.searchParams.get("tabela");
  const operacao = request.nextUrl.searchParams.get("operacao");

  let query = supabase
    .from("auditoria")
    .select("tabela, operacao, dados_antigos, dados_novos, usuario_nome, criado_em")
    .order("criado_em", { ascending: false });

  if (tabela) query = query.eq("tabela", tabela);
  if (operacao) query = query.eq("operacao", operacao as "INSERT" | "UPDATE" | "DELETE");

  const { data: registros, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cabecalho = ["Quando", "Quem", "Módulo", "Registro", "Operação", "Campos alterados"];

  const linhas = (registros ?? []).map((r) => {
    const dadosNovos = r.dados_novos as Record<string, unknown> | null;
    const dadosAntigos = r.dados_antigos as Record<string, unknown> | null;
    const alteracoes = camposAlterados(dadosAntigos, dadosNovos)
      .map((c) => `${c.campo}: ${c.de} → ${c.para}`)
      .join("; ");

    return [
      new Date(r.criado_em).toLocaleString("pt-BR"),
      r.usuario_nome ?? "—",
      TABELA_LABEL[r.tabela] ?? r.tabela,
      tituloRegistro(dadosNovos, dadosAntigos),
      OPERACAO_LABEL[r.operacao] ?? r.operacao,
      alteracoes,
    ]
      .map((campo) => csvEscape(String(campo ?? "")))
      .join(",");
  });

  const csv = [cabecalho.join(","), ...linhas].join("\r\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="auditoria.csv"`,
    },
  });
}
