import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatarData } from "@/lib/pdf/formato";

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

  const ano = request.nextUrl.searchParams.get("ano");

  let query = supabase
    .from("decretos_titulo_honorario")
    .select("numero, ano, data_decreto, nome_homenageado, autor_nome, autor_partido")
    .order("ano", { ascending: false })
    .order("numero", { ascending: false });

  if (ano) query = query.eq("ano", Number(ano));

  const { data: decretos, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cabecalho = ["Número", "Data", "Homenageado", "Autor", "Partido"];

  const linhas = (decretos ?? []).map((d) =>
    [`${d.numero}/${d.ano}`, formatarData(d.data_decreto), d.nome_homenageado, d.autor_nome, d.autor_partido]
      .map((campo) => csvEscape(String(campo ?? "")))
      .join(","),
  );

  const csv = [cabecalho.join(","), ...linhas].join("\r\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="decretos.csv"`,
    },
  });
}
