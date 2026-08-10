import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatarData } from "@/lib/pdf/formato";
import { LABEL_TIPO_MOCAO } from "@/lib/mocoes/documento";
import type { TipoMocao } from "@/lib/supabase/database.types";

function csvEscape(valor: string) {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const tipo = request.nextUrl.searchParams.get("tipo");

  let query = supabase
    .from("mocoes")
    .select("tipo, data_mocao, destinatario, autor:autor_vereador_id(nome, partido)")
    .order("data_mocao", { ascending: false });

  if (tipo) query = query.eq("tipo", tipo as TipoMocao);

  const { data: mocoes, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cabecalho = ["Data", "Tipo", "Destinatário", "Autor", "Partido"];

  const linhas = (mocoes ?? []).map((m) =>
    [
      formatarData(m.data_mocao),
      LABEL_TIPO_MOCAO[m.tipo as TipoMocao],
      m.destinatario,
      m.autor?.nome,
      m.autor?.partido,
    ]
      .map((campo) => csvEscape(String(campo ?? "")))
      .join(","),
  );

  const csv = [cabecalho.join(","), ...linhas].join("\r\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="mocoes.csv"`,
    },
  });
}
