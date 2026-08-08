"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sanitizarHtmlDocumento } from "@/lib/sanitizar-html";
import { corpoTextoEstaVazio } from "@/lib/oficios/documento";
import type { TipoOficio } from "@/lib/supabase/database.types";
import { exigirPodeCriar, exigirPodeGerenciar } from "./actions";

// Um modelo guarda só o que se repete de fato num ofício recorrente — tipo,
// assunto, texto e fechamento. Destinatário e autor ficam de fora de
// propósito: variam a cada envio, então não fazem parte de "reutilizável"
// (ver plano/contexto).
export async function salvarModelo(redirectPath: string, formData: FormData) {
  const usuario = await exigirPodeCriar(redirectPath);

  const nome_modelo = String(formData.get("nome_modelo") ?? "").trim();
  const tipo = String(formData.get("tipo") ?? "padrao") as TipoOficio;
  const assunto = String(formData.get("assunto") ?? "").trim();
  const corpo_texto = sanitizarHtmlDocumento(String(formData.get("corpo_texto") ?? "").trim());
  const paragrafo_fechamento = String(formData.get("paragrafo_fechamento") ?? "").trim();

  if (!nome_modelo || corpoTextoEstaVazio(corpo_texto)) {
    redirect(
      `${redirectPath}?error=${encodeURIComponent("Preencha o nome do modelo e o texto do ofício antes de salvar como modelo")}`,
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.from("oficios_modelos").insert({
    nome_modelo,
    tipo,
    assunto,
    corpo_texto,
    paragrafo_fechamento,
    criado_por: usuario!.id,
  });

  if (error) {
    redirect(`${redirectPath}?error=${encodeURIComponent("Erro ao salvar o modelo: " + error.message)}`);
  }

  redirect(`${redirectPath}?modeloSalvo=1`);
}

export async function excluirModelo(id: string) {
  await exigirPodeGerenciar("/oficios/modelos");

  const supabase = await createClient();
  const { error } = await supabase.from("oficios_modelos").delete().eq("id", id);

  revalidatePath("/oficios/modelos");

  if (error) {
    redirect(`/oficios/modelos?error=${encodeURIComponent("Não foi possível excluir: " + error.message)}`);
  }

  redirect("/oficios/modelos");
}
