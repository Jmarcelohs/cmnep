import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { editarUsuario, redefinirSenhaUsuario } from "../../actions";
import { UsuarioForm } from "../../usuario-form";
import type { Papel } from "@/lib/supabase/database.types";

export default async function EditarUsuarioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; sucesso?: string }>;
}) {
  const { id } = await params;
  const { error: errorMsg, sucesso } = await searchParams;
  const usuarioLogado = await getCurrentUsuario();
  if (usuarioLogado?.papel !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, nome, email, papel")
    .eq("id", id)
    .single();

  if (!usuario) notFound();

  const { data: pessoaVinculada } = await supabase
    .from("pessoas")
    .select("id")
    .eq("usuario_id", id)
    .maybeSingle();

  const { data: pessoasDisponiveis } = await supabase
    .from("pessoas")
    .select("id, nome")
    .or(`usuario_id.is.null,usuario_id.eq.${id}`)
    .order("nome");

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Editar usuário</h1>
      <p className="mt-1 text-sm text-slate-500">{usuario.nome}</p>

      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}
      {sucesso && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{sucesso}</p>
      )}

      <UsuarioForm
        action={editarUsuario.bind(null, id)}
        pessoas={pessoasDisponiveis ?? []}
        submitLabel="Salvar alterações"
        valoresIniciais={{
          nome: usuario.nome,
          email: usuario.email,
          papel: usuario.papel as Papel,
          pessoa_id: pessoaVinculada?.id ?? "",
        }}
      />

      <div className="mt-8 max-w-lg rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Redefinir senha</h2>
        <p className="mt-1 text-xs text-slate-500">
          Define uma nova senha provisória para esse usuário.
        </p>
        <form action={redefinirSenhaUsuario.bind(null, id)} className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <label htmlFor="nova_senha" className="block text-xs font-medium text-slate-500">Nova senha</label>
            <input
              id="nova_senha"
              name="nova_senha"
              type="text"
              required
              minLength={6}
              placeholder="mínimo 6 caracteres"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Redefinir
          </button>
        </form>
      </div>
    </div>
  );
}
