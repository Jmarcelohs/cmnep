"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function atualizarSenha(formData: FormData) {
  const senha = String(formData.get("senha") ?? "");
  const confirmarSenha = String(formData.get("confirmarSenha") ?? "");

  if (senha.length < 8) {
    redirect(`/redefinir-senha?error=${encodeURIComponent("A senha precisa ter pelo menos 8 caracteres.")}`);
  }
  if (senha !== confirmarSenha) {
    redirect(`/redefinir-senha?error=${encodeURIComponent("As senhas não coincidem.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: senha });

  if (error) {
    redirect(`/redefinir-senha?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/dashboard");
}
