import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { alternarAtivoAvaliador } from "../actions";
import { MenuAcoes } from "@/components/menu-acoes";

export default async function AvaliadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMsg } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/avaliacoes");

  const supabase = await createClient();
  const { data: avaliadores, error } = await supabase
    .from("avaliacoes_avaliadores")
    .select("id, nome, matricula, ativo")
    .order("nome");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Avaliadores</h1>
          <p className="mt-1 text-sm text-slate-500">
            Cadastro de responsáveis pelas avaliações — lista independente do cadastro de
            servidores, pode incluir gente fora do quadro avaliado.
          </p>
        </div>
        <Link
          href="/avaliacoes/avaliadores/novo"
          className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
        >
          Novo avaliador
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Erro ao carregar avaliadores: {error.message}
        </p>
      )}
      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Nome</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Matrícula</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Situação</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {avaliadores?.map((avaliador) => (
              <tr key={avaliador.id}>
                <td className="px-4 py-2 text-slate-900">{avaliador.nome}</td>
                <td className="px-4 py-2 text-slate-700">{avaliador.matricula ?? "—"}</td>
                <td className="px-4 py-2 text-slate-700">
                  {avaliador.ativo ? "Ativo" : "Inativo"}
                </td>
                <td className="px-4 py-2">
                  <MenuAcoes>
                    <Link
                      href={`/avaliacoes/avaliadores/${avaliador.id}/editar`}
                      className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Editar
                    </Link>
                    <form action={alternarAtivoAvaliador.bind(null, avaliador.id, avaliador.ativo)}>
                      <button
                        type="submit"
                        className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {avaliador.ativo ? "Inativar" : "Ativar"}
                      </button>
                    </form>
                  </MenuAcoes>
                </td>
              </tr>
            ))}
            {avaliadores?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Nenhum avaliador cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
