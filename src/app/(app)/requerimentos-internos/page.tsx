import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { TIPO_LABEL } from "@/lib/requerimentos-internos/assuntos";
import { CampoBusca } from "@/components/campo-busca";
import { Paginacao } from "@/components/paginacao";
import { construirFiltroBusca } from "@/lib/busca";
import { calcularPagina, totalDePaginas } from "@/lib/paginacao";
import { RequerimentosTabela } from "./requerimentos-tabela";
import type { StatusRequerimentoInterno, TipoRequerimentoInterno } from "@/lib/supabase/database.types";

const STATUS_LABEL: Record<StatusRequerimentoInterno, string> = {
  pendente: "Pendente",
  analise: "Em análise",
  deferido: "Deferido",
  indeferido: "Indeferido",
};

export default async function RequerimentosInternosPage({
  searchParams,
}: {
  searchParams: Promise<{
    tipo?: string;
    status?: string;
    busca?: string;
    pagina?: string;
    error?: string;
  }>;
}) {
  const { tipo, status, busca, pagina: paginaStr, error: errorMsg } = await searchParams;
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

  const { pagina, de, ate } = calcularPagina(paginaStr);

  let query = supabase
    .from("requerimentos_internos")
    .select("id, numero, ano, tipo, nome, cargo, assunto, data_requerimento, status, pessoa_id", {
      count: "exact",
    })
    .order("criado_em", { ascending: false })
    .range(de, ate);

  if (tipo) query = query.eq("tipo", tipo as TipoRequerimentoInterno);
  if (status) query = query.eq("status", status as StatusRequerimentoInterno);
  if (busca) query = query.or(construirFiltroBusca(busca, ["nome", "assunto"]));

  const { data: requerimentos, error, count } = await query;

  const paramsCsv = new URLSearchParams({
    ...(tipo ? { tipo } : {}),
    ...(status ? { status } : {}),
  }).toString();

  const paramsBase = new URLSearchParams({
    ...(tipo ? { tipo } : {}),
    ...(status ? { status } : {}),
    ...(busca ? { busca } : {}),
  });

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
        <CampoBusca defaultValue={busca} placeholder="Nome ou assunto" />
        <div>
          <label htmlFor="filtro-tipo" className="block text-xs font-medium text-slate-500">Categoria</label>
          <select
            id="filtro-tipo"
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
          <label htmlFor="filtro-status" className="block text-xs font-medium text-slate-500">Status</label>
          <select
            id="filtro-status"
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

      <div className="mt-4">
        <RequerimentosTabela
          requerimentos={requerimentos ?? []}
          podeGerenciarSempre={podeGerenciarSempre}
          minhaPessoaId={minhaPessoa?.id ?? null}
        />
      </div>

      <Paginacao
        pagina={pagina}
        totalPaginas={totalDePaginas(count)}
        count={count}
        baseHref="/requerimentos-internos"
        paramsBase={paramsBase}
      />
    </div>
  );
}
