import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { formatarData } from "@/lib/pdf/formato";
import { TIPO_OFICIO_LABEL } from "@/lib/oficios/documento";
import type { TipoOficio } from "@/lib/supabase/database.types";

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
  const tipo = request.nextUrl.searchParams.get("tipo");

  let query = supabase
    .from("oficios")
    .select("numero, ano, tipo, data_oficio, destinatario_nome, assunto")
    .order("ano", { ascending: false })
    .order("numero", { ascending: false });

  if (ano) query = query.eq("ano", Number(ano));
  if (tipo) query = query.eq("tipo", tipo as TipoOficio);

  const { data: oficios, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cabecalho = ["Número", "Tipo", "Data", "Destinatário", "Assunto"];

  const linhas = (oficios ?? []).map((o) =>
    [
      `${o.numero}/${o.ano}`,
      TIPO_OFICIO_LABEL[o.tipo as TipoOficio] ?? o.tipo,
      formatarData(o.data_oficio),
      o.destinatario_nome,
      o.assunto,
    ]
      .map((campo) => csvEscape(String(campo ?? "")))
      .join(","),
  );

  const csv = [cabecalho.join(","), ...linhas].join("\r\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="oficios.csv"`,
    },
  });
}
