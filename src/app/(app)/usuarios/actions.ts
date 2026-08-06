"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import type { Papel } from "@/lib/supabase/database.types";

async function exigirAdmin() {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/dashboard");
  return usuario;
}

async function vincularPessoa(
  supabase: Awaited<ReturnType<typeof createClient>>,
  usuarioId: string,
  pessoaId: string | null,
) {
  // Desvincula qualquer pessoa que hoje aponte pra esse usuário (pode ter
  // mudado a seleção) e vincula a nova, se houver.
  await supabase.from("pessoas").update({ usuario_id: null }).eq("usuario_id", usuarioId);
  if (pessoaId) {
    await supabase.from("pessoas").update({ usuario_id: usuarioId }).eq("id", pessoaId);
  }
}

export async function criarUsuario(formData: FormData) {
  await exigirAdmin();

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const senha = String(formData.get("senha") ?? "");
  const papel = String(formData.get("papel") ?? "") as Papel;
  const pessoa_id = String(formData.get("pessoa_id") ?? "") || null;

  if (!nome || !email || !senha || !papel) {
    redirect(`/usuarios/novo?error=${encodeURIComponent("Preencha nome, e-mail, senha e papel")}`);
  }
  if (senha.length < 6) {
    redirect(`/usuarios/novo?error=${encodeURIComponent("A senha precisa ter ao menos 6 caracteres")}`);
  }

  // Cria o login já com a senha definida na hora (email_confirm:true
  // dispensa qualquer e-mail de confirmação/convite do Supabase) — o
  // convite por e-mail foi tentado antes, mas causava erro com frequência
  // (provavelmente limite de envio do serviço de e-mail padrão do
  // Supabase). Admin repassa a senha provisória pra pessoa por fora do
  // sistema; ela troca depois de logar.
  const admin = createAdminClient();

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    const mensagem = authError?.message.includes("already been registered")
      ? "Já existe um usuário com esse e-mail."
      : (authError?.message ?? "Erro ao criar o login");
    redirect(`/usuarios/novo?error=${encodeURIComponent(mensagem)}`);
  }

  const supabase = await createClient();
  const { data: usuario, error } = await supabase
    .from("usuarios")
    .insert({ auth_user_id: authData.user!.id, nome, email, papel })
    .select("id")
    .single();

  if (error || !usuario) {
    // Reverte o usuário de login já criado pra não sobrar um auth.users
    // órfão (loga mas não aparece em lugar nenhum do sistema).
    await admin.auth.admin.deleteUser(authData.user!.id);
    redirect(`/usuarios/novo?error=${encodeURIComponent(error?.message ?? "Erro ao salvar o usuário")}`);
  }

  if (pessoa_id) {
    await vincularPessoa(supabase, usuario!.id, pessoa_id);
  }

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function editarUsuario(id: string, formData: FormData) {
  const usuarioAtual = await exigirAdmin();

  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const papel = String(formData.get("papel") ?? "") as Papel;
  const pessoa_id = String(formData.get("pessoa_id") ?? "") || null;

  if (!nome || !email || !papel) {
    redirect(`/usuarios/${id}/editar?error=${encodeURIComponent("Preencha nome, e-mail e papel")}`);
  }

  const supabase = await createClient();

  if (usuarioAtual!.id === id && papel !== "admin") {
    redirect(`/usuarios/${id}/editar?error=${encodeURIComponent("Você não pode remover o próprio papel de admin")}`);
  }

  const { data: alvo } = await supabase
    .from("usuarios")
    .select("auth_user_id, email")
    .eq("id", id)
    .single();

  if (!alvo) redirect("/usuarios");

  if (email !== alvo!.email && alvo!.auth_user_id) {
    const admin = createAdminClient();
    const { error: authError } = await admin.auth.admin.updateUserById(alvo!.auth_user_id, { email });
    if (authError) {
      redirect(`/usuarios/${id}/editar?error=${encodeURIComponent(authError.message)}`);
    }
  }

  const { error } = await supabase.from("usuarios").update({ nome, email, papel }).eq("id", id);

  if (error) {
    redirect(`/usuarios/${id}/editar?error=${encodeURIComponent(error.message)}`);
  }

  await vincularPessoa(supabase, id, pessoa_id);

  revalidatePath("/usuarios");
  redirect("/usuarios");
}

export async function redefinirSenhaUsuario(id: string, formData: FormData) {
  await exigirAdmin();

  const novaSenha = String(formData.get("nova_senha") ?? "");
  if (novaSenha.length < 6) {
    redirect(`/usuarios/${id}/editar?error=${encodeURIComponent("A senha precisa ter ao menos 6 caracteres")}`);
  }

  const supabase = await createClient();
  const { data: alvo } = await supabase
    .from("usuarios")
    .select("auth_user_id")
    .eq("id", id)
    .single();

  if (!alvo?.auth_user_id) {
    redirect(`/usuarios/${id}/editar?error=${encodeURIComponent("Usuário sem login vinculado")}`);
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(alvo!.auth_user_id!, { password: novaSenha });

  if (error) {
    redirect(`/usuarios/${id}/editar?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/usuarios/${id}/editar?sucesso=${encodeURIComponent("Senha redefinida com sucesso")}`);
}

export async function alternarAtivoUsuario(id: string, ativoAtual: boolean) {
  const usuarioAtual = await exigirAdmin();

  if (usuarioAtual!.id === id) {
    redirect(`/usuarios?error=${encodeURIComponent("Você não pode inativar a própria conta")}`);
  }

  const supabase = await createClient();

  if (ativoAtual) {
    const { count } = await supabase
      .from("usuarios")
      .select("id", { count: "exact", head: true })
      .eq("papel", "admin")
      .eq("ativo", true);

    const { data: alvo } = await supabase.from("usuarios").select("papel").eq("id", id).single();
    if (alvo?.papel === "admin" && (count ?? 0) <= 1) {
      redirect(`/usuarios?error=${encodeURIComponent("Não é possível inativar o último administrador ativo")}`);
    }
  }

  await supabase.from("usuarios").update({ ativo: !ativoAtual }).eq("id", id);
  revalidatePath("/usuarios");
}

export async function excluirUsuario(id: string) {
  const usuarioAtual = await exigirAdmin();

  if (usuarioAtual!.id === id) {
    redirect(`/usuarios?error=${encodeURIComponent("Você não pode excluir a própria conta")}`);
  }

  const supabase = await createClient();
  const { data: alvo } = await supabase
    .from("usuarios")
    .select("auth_user_id, papel")
    .eq("id", id)
    .single();

  if (!alvo) redirect("/usuarios");

  if (alvo!.papel === "admin") {
    const { count } = await supabase
      .from("usuarios")
      .select("id", { count: "exact", head: true })
      .eq("papel", "admin")
      .eq("ativo", true);
    if ((count ?? 0) <= 1) {
      redirect(`/usuarios?error=${encodeURIComponent("Não é possível excluir o último administrador")}`);
    }
  }

  if (alvo!.auth_user_id) {
    // Cascata (on delete cascade) já remove a linha de "usuarios" junto.
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(alvo!.auth_user_id);
    if (error) {
      redirect(`/usuarios?error=${encodeURIComponent("Não foi possível excluir: " + error.message)}`);
    }
  } else {
    await supabase.from("usuarios").delete().eq("id", id);
  }

  revalidatePath("/usuarios");
  redirect("/usuarios");
}
