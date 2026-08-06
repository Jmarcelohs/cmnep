import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { criarUsuario } from "../actions";
import { UsuarioForm } from "../usuario-form";

export default async function NovoUsuarioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMsg } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: pessoas } = await supabase
    .from("pessoas")
    .select("id, nome")
    .is("usuario_id", null)
    .order("nome");

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Novo usuário</h1>
      <p className="mt-1 text-sm text-slate-500">
        Cria o login (Supabase Auth) e o vínculo de papel em um só passo.
      </p>

      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <UsuarioForm
        action={criarUsuario}
        pessoas={pessoas ?? []}
        submitLabel="Criar usuário"
        pedirSenha
      />
    </div>
  );
}
