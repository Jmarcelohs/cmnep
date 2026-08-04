import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { MenuAcoes } from "@/components/menu-acoes";
import { alternarAtivoUsuario, excluirUsuario } from "./actions";

const PAPEL_LABEL: Record<string, string> = {
  admin: "Administrador",
  servidor: "Servidor",
  ordenador_despesa: "Ordenador da despesa",
  tesoureiro: "Tesoureiro",
  controle_interno: "Controle interno",
  gestor_diarias: "Gestor de Diárias",
};

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMsg } = await searchParams;
  const usuarioLogado = await getCurrentUsuario();
  if (usuarioLogado?.papel !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: usuarios, error } = await supabase
    .from("usuarios")
    .select("id, nome, email, papel, ativo, pessoas(nome)")
    .order("nome");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Usuários</h1>
          <p className="mt-1 text-sm text-slate-500">
            Login e papel de cada pessoa que acessa o sistema.
          </p>
        </div>
        <Link
          href="/usuarios/novo"
          className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
        >
          Novo usuário
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Erro ao carregar usuários: {error.message}
        </p>
      )}
      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Nome</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">E-mail</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Papel</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Pessoa vinculada</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Situação</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usuarios?.map((u) => {
              const pessoas = u.pessoas as unknown as { nome: string }[] | { nome: string } | null;
              const nomePessoa = Array.isArray(pessoas) ? pessoas[0]?.nome : pessoas?.nome;
              const souEu = u.id === usuarioLogado.id;
              return (
                <tr key={u.id}>
                  <td className="px-4 py-2 text-slate-900">
                    {u.nome} {souEu && <span className="text-xs text-slate-400">(você)</span>}
                  </td>
                  <td className="px-4 py-2 text-slate-700">{u.email}</td>
                  <td className="px-4 py-2 text-slate-700">{PAPEL_LABEL[u.papel] ?? u.papel}</td>
                  <td className="px-4 py-2 text-slate-700">{nomePessoa ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-700">{u.ativo ? "Ativo" : "Inativo"}</td>
                  <td className="px-4 py-2">
                    <MenuAcoes>
                      <Link
                        href={`/usuarios/${u.id}/editar`}
                        className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </Link>
                      {!souEu && (
                        <>
                          <form action={alternarAtivoUsuario.bind(null, u.id, u.ativo)}>
                            <button
                              type="submit"
                              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                            >
                              {u.ativo ? "Inativar" : "Ativar"}
                            </button>
                          </form>
                          <ExcluirSolicitacaoButton
                            variant="menu"
                            action={excluirUsuario.bind(null, u.id)}
                            mensagemConfirmacao={`Tem certeza que deseja excluir o usuário "${u.nome}"? O login dessa pessoa deixa de funcionar imediatamente. Essa ação não pode ser desfeita.`}
                          />
                        </>
                      )}
                    </MenuAcoes>
                  </td>
                </tr>
              );
            })}
            {usuarios?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Nenhum usuário cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
