import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { alternarAtivoAutoridade, excluirAutoridade } from "./actions";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { MenuAcoes } from "@/components/menu-acoes";
import { CampoBusca } from "@/components/campo-busca";
import { construirFiltroBusca } from "@/lib/busca";

export default async function AutoridadesPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; error?: string }>;
}) {
  const { busca, error: errorMsg } = await searchParams;
  const usuario = await getCurrentUsuario();
  const ehAdmin = usuario?.papel === "admin";

  const supabase = await createClient();
  let query = supabase
    .from("autoridades")
    .select("id, tratamento, nome, cargo, cidade_uf, ativo")
    .order("nome");

  if (busca) query = query.or(construirFiltroBusca(busca, ["nome", "cargo"]));

  const { data: autoridades, error } = await query;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Autoridades</h1>
          <p className="mt-1 text-sm text-slate-500">
            Endereçamento rápido de ofícios — alimenta o preenchimento automático do destinatário.
          </p>
        </div>
        {ehAdmin && (
          <Link
            href="/autoridades/nova"
            className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
          >
            Nova autoridade
          </Link>
        )}
      </div>

      <form className="mt-4 flex flex-wrap items-end gap-3 text-sm" action="/autoridades">
        <CampoBusca defaultValue={busca} placeholder="Nome ou cargo" />
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Filtrar
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Erro ao carregar autoridades: {error.message}
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
              <th className="px-4 py-2 text-left font-medium text-slate-600">Cargo</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Situação</th>
              {ehAdmin && (
                <th className="px-4 py-2 text-left font-medium text-slate-600">Ações</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {autoridades?.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-2 text-slate-900">{a.nome}</td>
                <td className="px-4 py-2 text-slate-700">
                  {a.cargo}
                  {a.cidade_uf && ` — ${a.cidade_uf}`}
                </td>
                <td className="px-4 py-2 text-slate-700">{a.ativo ? "Ativa" : "Inativa"}</td>
                {ehAdmin && (
                  <td className="px-4 py-2">
                    <MenuAcoes>
                      <Link
                        href={`/autoridades/${a.id}/editar`}
                        className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </Link>
                      <form action={alternarAtivoAutoridade.bind(null, a.id, a.ativo)}>
                        <button
                          type="submit"
                          className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                        >
                          {a.ativo ? "Inativar" : "Ativar"}
                        </button>
                      </form>
                      <ExcluirSolicitacaoButton
                        variant="menu"
                        action={excluirAutoridade.bind(null, a.id)}
                        mensagemConfirmacao={`Tem certeza que deseja excluir "${a.nome}"?`}
                      />
                    </MenuAcoes>
                  </td>
                )}
              </tr>
            ))}
            {autoridades?.length === 0 && (
              <tr>
                <td colSpan={ehAdmin ? 4 : 3} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma autoridade cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
