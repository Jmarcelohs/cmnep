import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function csvEscape(valor: string) {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data: pessoas, error } = await supabase
    .from("pessoas")
    .select("matricula, nome, cargo, categoria, partido, ativo")
    .order("nome");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const cabecalho = ["Matrícula", "Nome", "Cargo", "Categoria", "Partido", "Situação"];

  const linhas = (pessoas ?? []).map((p) =>
    [p.matricula, p.nome, p.cargo, p.categoria, p.partido, p.ativo ? "Ativo" : "Inativo"]
      .map((campo) => csvEscape(String(campo ?? "")))
      .join(","),
  );

  const csv = [cabecalho.join(","), ...linhas].join("\r\n");
  const bom = "﻿";

  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pessoas.csv"`,
    },
  });
}
