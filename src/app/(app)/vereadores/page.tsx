import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { alternarAtivoVereador, excluirVereador } from "./actions";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { MenuAcoes } from "@/components/menu-acoes";
import { CampoBusca } from "@/components/campo-busca";
import { construirFiltroBusca } from "@/lib/busca";

export default async function VereadoresPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; error?: string }>;
}) {
  const { busca, error: errorMsg } = await searchParams;
  const usuario = await getCurrentUsuario();
  const ehAdmin = usuario?.papel === "admin";

  const supabase = await createClient();
  let query = supabase
    .from("vereadores")
    .select("id, nome, partido, presidente, assinatura_caminho, ativo")
    .order("presidente", { ascending: false })
    .order("nome");

  if (busca) query = query.or(construirFiltroBusca(busca, ["nome", "partido"]));

  const { data: vereadores, error } = await query;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Vereadores</h1>
          <p className="mt-1 text-sm text-slate-500">
            Alimenta a seleção de autor e associados em Moções — a imagem de assinatura cadastrada
            aqui é colada automaticamente no PDF.
          </p>
        </div>
        {ehAdmin && (
          <Link
            href="/vereadores/novo"
            className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
          >
            Novo vereador
          </Link>
        )}
      </div>

      <form className="mt-4 flex flex-wrap items-end gap-3 text-sm" action="/vereadores">
        <CampoBusca defaultValue={busca} placeholder="Nome ou partido" />
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Filtrar
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Erro ao carregar vereadores: {error.message}
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
              <th className="px-4 py-2 text-left font-medium text-slate-600">Partido</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Assinatura</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Situação</th>
              {ehAdmin && (
                <th className="px-4 py-2 text-left font-medium text-slate-600">Ações</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vereadores?.map((v) => (
              <tr key={v.id}>
                <td className="px-4 py-2 text-slate-900">
                  {v.nome}
                  {v.presidente && (
                    <span className="ml-2 rounded-full bg-brand-navy/10 px-2 py-0.5 text-xs font-medium text-brand-navy">
                      Presidente
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-700">{v.partido ?? "—"}</td>
                <td className="px-4 py-2 text-slate-700">
                  {v.assinatura_caminho ? "Cadastrada" : "Não cadastrada"}
                </td>
                <td className="px-4 py-2 text-slate-700">{v.ativo ? "Ativo" : "Inativo"}</td>
                {ehAdmin && (
                  <td className="px-4 py-2">
                    <MenuAcoes>
                      <Link
                        href={`/vereadores/${v.id}/editar`}
                        className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </Link>
                      <form action={alternarAtivoVereador.bind(null, v.id, v.ativo)}>
                        <button
                          type="submit"
                          className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {v.ativo ? "Inativar" : "Ativar"}
                        </button>
                      </form>
                      <ExcluirSolicitacaoButton
                        variant="menu"
                        action={excluirVereador.bind(null, v.id)}
                        mensagemConfirmacao={`Tem certeza que deseja excluir "${v.nome}"? Só é possível se ele não tiver moções cadastradas.`}
                      />
                    </MenuAcoes>
                  </td>
                )}
              </tr>
            ))}
            {vereadores?.length === 0 && (
              <tr>
                <td colSpan={ehAdmin ? 5 : 4} className="px-4 py-6 text-center text-slate-400">
                  Nenhum vereador cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
