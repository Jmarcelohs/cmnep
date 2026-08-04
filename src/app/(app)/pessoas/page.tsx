import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { alternarAtivoPessoa, excluirPessoa } from "./actions";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { MenuAcoes } from "@/components/menu-acoes";

export default async function PessoasPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMsg } = await searchParams;
  const usuario = await getCurrentUsuario();
  const ehAdmin = usuario?.papel === "admin";

  const supabase = await createClient();
  const { data: pessoas, error } = await supabase
    .from("pessoas")
    .select("id, matricula, nome, cargo, categoria, ativo")
    .order("nome");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Pessoas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cadastro único de servidores e vereadores, compartilhado entre todos os módulos.
          </p>
        </div>
        {ehAdmin && (
          <Link
            href="/pessoas/nova"
            className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
          >
            Nova pessoa
          </Link>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Erro ao carregar pessoas: {error.message}
        </p>
      )}
      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Matrícula</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Nome</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Cargo</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Categoria</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Situação</th>
              {ehAdmin && (
                <th className="px-4 py-2 text-left font-medium text-slate-500">Ações</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pessoas?.map((pessoa) => (
              <tr key={pessoa.id}>
                <td className="px-4 py-2 text-slate-700">{pessoa.matricula ?? "—"}</td>
                <td className="px-4 py-2 text-slate-900">{pessoa.nome}</td>
                <td className="px-4 py-2 text-slate-700">{pessoa.cargo}</td>
                <td className="px-4 py-2 text-slate-700">{pessoa.categoria}</td>
                <td className="px-4 py-2 text-slate-700">
                  {pessoa.ativo ? "Ativo" : "Inativo"}
                </td>
                {ehAdmin && (
                  <td className="px-4 py-2">
                    <MenuAcoes>
                      <Link
                        href={`/pessoas/${pessoa.id}/editar`}
                        className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </Link>
                      <form action={alternarAtivoPessoa.bind(null, pessoa.id, pessoa.ativo)}>
                        <button
                          type="submit"
                          className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {pessoa.ativo ? "Inativar" : "Ativar"}
                        </button>
                      </form>
                      <ExcluirSolicitacaoButton
                        variant="menu"
                        action={excluirPessoa.bind(null, pessoa.id)}
                        mensagemConfirmacao={`Tem certeza que deseja excluir "${pessoa.nome}"? Só funciona se não houver diárias ou outros registros vinculados a essa pessoa — caso contrário, use "Inativar".`}
                      />
                    </MenuAcoes>
                  </td>
                )}
              </tr>
            ))}
            {pessoas?.length === 0 && (
              <tr>
                <td colSpan={ehAdmin ? 6 : 5} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma pessoa cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
