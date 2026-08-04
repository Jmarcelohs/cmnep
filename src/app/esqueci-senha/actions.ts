"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function enviarRecuperacaoSenha(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const origem = `${proto}://${host}`;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origem}/auth/callback?next=/redefinir-senha`,
  });

  // Mesma mensagem sempre, exista ou não o e-mail cadastrado — evita que
  // alguém descubra quais e-mails têm conta só tentando aqui.
  redirect("/esqueci-senha?enviado=1");
}
