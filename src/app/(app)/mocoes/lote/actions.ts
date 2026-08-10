"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { validarLoteMocoes, type LinhaLoteMocao } from "./validacao";
import type { TipoMocao } from "@/lib/supabase/database.types";

async function exigirPodeCriarMocao(redirectPath: string) {
  const usuario = await getCurrentUsuario();
  if (
    usuario?.papel !== "admin" &&
    usuario?.papel !== "ordenador_despesa" &&
    usuario?.papel !== "servidor" &&
    usuario?.papel !== "estagiario"
  ) {
    redirect(redirectPath);
  }
  return usuario;
}

function lerLinhas(formData: FormData): LinhaLoteMocao[] {
  let linhas: LinhaLoteMocao[] = [];
  try {
    linhas = JSON.parse(String(formData.get("linhas") ?? "[]"));
  } catch {
    linhas = [];
  }
  return linhas.map((l) => ({
    destinatario: String(l.destinatario ?? "").trim(),
    destinatario_tratamento: l.destinatario_tratamento ?? null,
    justificativa: String(l.justificativa ?? "").trim(),
  }));
}

export async function criarMocoesEmLote(formData: FormData) {
  const usuario = await exigirPodeCriarMocao("/mocoes");

  const tipo = String(formData.get("tipo") ?? "") as TipoMocao;
  const data_mocao = String(formData.get("data_mocao") ?? "");
  const autor_vereador_id = String(formData.get("autor_vereador_id") ?? "").trim();

  let associados_vereadores_ids: string[] = [];
  try {
    associados_vereadores_ids = JSON.parse(String(formData.get("associados_vereadores_ids") ?? "[]"));
  } catch {
    associados_vereadores_ids = [];
  }
  associados_vereadores_ids = associados_vereadores_ids.filter(
    (id) => typeof id === "string" && id && id !== autor_vereador_id,
  );

  const linhas = lerLinhas(formData);

  const erro = validarLoteMocoes({ tipo, data_mocao, autor_vereador_id, linhas });
  if (erro) {
    redirect(`/mocoes/lote?error=${encodeURIComponent(erro)}`);
  }

  const lote_id = crypto.randomUUID();
  const supabase = await createClient();

  const { data: criadas, error } = await supabase
    .from("mocoes")
    .insert(
      linhas.map((linha) => ({
        tipo,
        data_mocao,
        destinatario: linha.destinatario,
        destinatario_tratamento: tipo === "pesar" ? linha.destinatario_tratamento : null,
        autor_vereador_id,
        associados_vereadores_ids,
        justificativa: tipo === "pesar" ? "" : linha.justificativa,
        lote_id,
        criado_por: usuario!.id,
      })),
    )
    .select("id");

  if (error || !criadas || criadas.length === 0) {
    redirect(
      `/mocoes/lote?error=${encodeURIComponent(error?.message ?? "Erro ao salvar as moções")}`,
    );
  }

  revalidatePath("/mocoes");
  redirect(`/mocoes/lote/${lote_id}`);
}
