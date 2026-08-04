import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import {
  OPERACAO_LABEL,
  OPERACAO_STYLES,
  TABELA_LABEL,
  tituloRegistro,
} from "@/lib/auditoria/formato";

const POR_PAGINA = 50;

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ tabela?: string; operacao?: string; pagina?: string; error?: string }>;
}) {
  const { tabela, operacao, pagina: paginaStr, error: errorMsg } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/dashboard");

  const pagina = Math.max(1, Number(paginaStr) || 1);
  const de = (pagina - 1) * POR_PAGINA;
  const ate = de + POR_PAGINA - 1;

  const supabase = await createClient();

  let query = supabase
    .from("auditoria")
    .select("id, tabela, registro_id, operacao, dados_antigos, dados_novos, usuario_nome, criado_em", {
      count: "exact",
    })
    .order("criado_em", { ascending: false })
    .range(de, ate);

  if (tabela) query = query.eq("tabela", tabela);
  if (operacao) query = query.eq("operacao", operacao as "INSERT" | "UPDATE" | "DELETE");

  const { data: registros, error, count } = await query;

  const totalPaginas = count ? Math.ceil(count / POR_PAGINA) : 1;

  const paramsBase = new URLSearchParams({
    ...(tabela ? { tabela } : {}),
    ...(operacao ? { operacao } : {}),
  });

  return (
    <div>
      <div>
        <h1 className="text-xl font-semibold text-brand-navy">Histórico e Auditoria</h1>
        <p className="mt-1 text-sm text-slate-500">
          Registro automático de toda criação, edição e exclusão nos módulos do sistema — quem
          fez, quando e o que mudou. Visível só pra administradores.
        </p>
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3 text-sm" action="/auditoria">
        <div>
          <label className="block text-xs font-medium text-slate-500">Módulo</label>
          <select
            name="tabela"
            defaultValue={tabela ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {Object.entries(TABELA_LABEL).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Operação</label>
          <select
            name="operacao"
            defaultValue={operacao ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            {Object.entries(OPERACAO_LABEL).map(([valor, label]) => (
              <option key={valor} value={valor}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Filtrar
        </button>
      </form>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Erro ao carregar histórico: {error.message}
        </p>
      )}
      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Quando</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Quem</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Módulo</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Registro</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Operação</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Detalhes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {registros?.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 whitespace-nowrap text-slate-700">
                  {new Date(r.criado_em).toLocaleString("pt-BR")}
                </td>
                <td className="px-4 py-2 text-slate-700">{r.usuario_nome ?? "—"}</td>
                <td className="px-4 py-2 text-slate-700">{TABELA_LABEL[r.tabela] ?? r.tabela}</td>
                <td className="px-4 py-2 text-slate-900">
                  {tituloRegistro(
                    r.dados_novos as Record<string, unknown> | null,
                    r.dados_antigos as Record<string, unknown> | null,
                  )}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${OPERACAO_STYLES[r.operacao] ?? ""}`}
                  >
                    {OPERACAO_LABEL[r.operacao] ?? r.operacao}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/auditoria/${r.id}`}
                    className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
            {registros?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <p className="text-slate-500">
            Página {pagina} de {totalPaginas} ({count} registros)
          </p>
          <div className="flex gap-2">
            {pagina > 1 && (
              <Link
                href={`/auditoria?${paramsBase.toString()}&pagina=${pagina - 1}`}
                className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Anterior
              </Link>
            )}
            {pagina < totalPaginas && (
              <Link
                href={`/auditoria?${paramsBase.toString()}&pagina=${pagina + 1}`}
                className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
              >
                Próxima
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
