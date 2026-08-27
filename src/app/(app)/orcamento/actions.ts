"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";

export async function solicitarAtualizacaoOrcamento() {
  const usuario = await getCurrentUsuario();
  if (!usuario || !["admin", "ordenador_despesa"].includes(usuario.papel)) {
    throw new Error("Sem permissão pra solicitar atualização do orçamento.");
  }

  const supabase = await createClient();
  await supabase.from("orcamento_solicitacoes_atualizacao").insert({ solicitado_por: usuario.id });

  revalidatePath("/orcamento");
}
