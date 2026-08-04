import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { formatarData } from "@/lib/pdf/formato";
import { TIPO_LABEL } from "@/lib/requerimentos-internos/assuntos";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { MenuAcoes } from "@/components/menu-acoes";
import { excluirRequerimentoInterno } from "./actions";
import type { StatusRequerimentoInterno, TipoRequerimentoInterno } from "@/lib/supabase/database.types";

const STATUS_LABEL: Record<StatusRequerimentoInterno, string> = {
  pendente: "Pendente",
  analise: "Em análise",
  deferido: "Deferido",
  indeferido: "Indeferido",
};

const STATUS_STYLES: Record<StatusRequerimentoInterno, string> = {
  pendente: "bg-amber-50 text-amber-700",
  analise: "bg-slate-100 text-slate-600",
  deferido: "bg-emerald-50 text-emerald-700",
  indeferido: "bg-red-50 text-red-700",
};

export default async function RequerimentosInternosPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; status?: string; error?: string }>;
}) {
  const { tipo, status, error: errorMsg } = await searchParams;
  const supabase = await createClient();
  const usuario = await getCurrentUsuario();

  const { data: minhaPessoa } = usuario
    ? await supabase.from("pessoas").select("id").eq("usuario_id", usuario.id).maybeSingle()
    : { data: null };

  const podeGerenciarSempre = usuario?.papel === "admin" || usuario?.papel === "ordenador_despesa";

  const { data: todos } = await supabase
    .from("requerimentos_internos")
    .select("id, status");

  const contagemStatus: Record<StatusRequerimentoInterno, number> = {
    pendente: 0,
    analise: 0,
    deferido: 0,
    indeferido: 0,
  };

  for (const r of todos ?? []) {
    contagemStatus[r.status as StatusRequerimentoInterno]++;
  }

  let query = supabase
    .from("requerimentos_internos")
    .select("id, numero, ano, tipo, nome, cargo, assunto, data_requerimento, status, pessoa_id")
    .order("criado_em", { ascending: false });

  if (tipo) query = query.eq("tipo", tipo as TipoRequerimentoInterno);
  if (status) query = query.eq("status", status as StatusRequerimentoInterno);

  const { data: requerimentos, error } = await query;

  const paramsCsv = new URLSearchParams({
    ...(tipo ? { tipo } : {}),
    ...(status ? { status } : {}),
  }).toString();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Requerimentos Internos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Endereçados ao Presidente da Câmara Municipal.
          </p>
        </div>
        <Link
          href="/requerimentos-internos/novo"
          className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
        >
          Novo requerimento
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(Object.keys(STATUS_LABEL) as StatusRequerimentoInterno[]).map((s) => (
          <div key={s} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{STATUS_LABEL[s]}</p>
            <p className="mt-1 text-2xl font-semibold text-brand-navy">{contagemStatus[s]}</p>
          </div>
        ))}
      </div>

      <form className="mt-6 flex flex-wrap items-end gap-3 text-sm" action="/requerimentos-internos">
        <div>
          <label className="block text-xs font-medium text-slate-500">Categoria</label>
          <select
            name="tipo"
            defaultValue={tipo ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            {(Object.keys(TIPO_LABEL) as TipoRequerimentoInterno[]).map((t) => (
              <option key={t} value={t}>
                {TIPO_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">Status</label>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {(Object.keys(STATUS_LABEL) as StatusRequerimentoInterno[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
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
        <a
          href={`/api/requerimentos-internos/csv?${paramsCsv}`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Exportar CSV
        </a>
      </form>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Erro ao carregar requerimentos: {error.message}
        </p>
      )}
      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Nº</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Categoria</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Solicitante</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Assunto</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Data</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requerimentos?.map((r) => {
              const podeGerenciar =
                podeGerenciarSempre || (r.pessoa_id && minhaPessoa?.id === r.pessoa_id);
              const podeEditar = podeGerenciar && r.status === "pendente";
              const podeExcluir = podeGerenciar;
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/requerimentos-internos/${r.id}`} className="block text-slate-900">
                      {r.numero}/{r.ano}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-700">{TIPO_LABEL[r.tipo as TipoRequerimentoInterno]}</td>
                  <td className="px-4 py-2 text-slate-700">{r.nome}</td>
                  <td className="px-4 py-2 text-slate-700">{r.assunto}</td>
                  <td className="px-4 py-2 text-slate-700">{formatarData(r.data_requerimento)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[r.status as StatusRequerimentoInterno] ?? ""}`}
                    >
                      {STATUS_LABEL[r.status as StatusRequerimentoInterno] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <MenuAcoes>
                      <Link
                        href={`/requerimentos-internos/${r.id}`}
                        className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Ver
                      </Link>
                      {podeEditar && (
                        <Link
                          href={`/requerimentos-internos/${r.id}/editar`}
                          className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Editar
                        </Link>
                      )}
                      <DownloadPdfButton
                        variant="menu"
                        url={`/api/requerimentos-internos/${r.id}/pdf`}
                        nomeArquivoPadrao={`requerimento-${r.numero}-${r.ano}.pdf`}
                      />
                      {podeExcluir && (
                        <ExcluirSolicitacaoButton
                          variant="menu"
                          action={excluirRequerimentoInterno.bind(null, r.id)}
                          mensagemConfirmacao={`Tem certeza que deseja excluir o requerimento ${r.numero}/${r.ano}? Essa ação não pode ser desfeita.`}
                        />
                      )}
                    </MenuAcoes>
                  </td>
                </tr>
              );
            })}
            {requerimentos?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Nenhum requerimento encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
