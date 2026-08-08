import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { CampoBusca } from "@/components/campo-busca";
import { Paginacao } from "@/components/paginacao";
import { buscarIdsPessoasPorNome, construirFiltroBusca } from "@/lib/busca";
import { calcularPagina, totalDePaginas } from "@/lib/paginacao";
import { RequerimentosTabela } from "./requerimentos-tabela";

export default async function RequerimentosPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string; ano?: string; pagina?: string; error?: string }>;
}) {
  const { busca, ano: anoParam, pagina: paginaStr, error: errorMsg } = await searchParams;
  const supabase = await createClient();
  const usuario = await getCurrentUsuario();

  const anoAtual = new Date().getFullYear();
  const anoSelecionado = anoParam === "todos" ? null : Number(anoParam) || anoAtual;

  const { data: minhaPessoa } = usuario
    ? await supabase.from("pessoas").select("id").eq("usuario_id", usuario.id).maybeSingle()
    : { data: null };

  const podeGerenciarSempre =
    usuario?.papel === "admin" ||
    usuario?.papel === "ordenador_despesa" ||
    usuario?.papel === "gestor_diarias";

  const { pagina, de, ate } = calcularPagina(paginaStr);

  let query = supabase
    .from("requerimentos_reembolso")
    .select("id, protocolo, subassunto, valor, status, pessoa_id, municipio, pessoas(nome)", {
      count: "exact",
    })
    .order("criado_em", { ascending: false })
    .range(de, ate);

  if (anoSelecionado) {
    query = query
      .gte("data_requerimento", `${anoSelecionado}-01-01`)
      .lt("data_requerimento", `${anoSelecionado + 1}-01-01`);
  }
  if (busca) {
    const idsPessoas = await buscarIdsPessoasPorNome(supabase, busca);
    query = query.or(
      construirFiltroBusca(busca, ["protocolo", "municipio"], {
        coluna: "pessoa_id",
        ids: idsPessoas,
      }),
    );
  }

  const { data: requerimentos, error, count } = await query;

  const { data: todasDatas } = await supabase
    .from("requerimentos_reembolso")
    .select("data_requerimento");
  const anosDisponiveis = Array.from(
    new Set([anoAtual, ...(todasDatas ?? []).map((d) => Number(d.data_requerimento?.slice(0, 4)))]),
  )
    .filter(Boolean)
    .sort((a, b) => b - a);

  const paramsBase = new URLSearchParams({
    ...(busca ? { busca } : {}),
    ...(anoParam ? { ano: anoParam } : {}),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Requerimentos de Reembolso</h1>
          <p className="mt-1 text-sm text-slate-500">
            Reembolso de despesas de locomoção — Art. 9º da Resolução nº 40/2023.
          </p>
        </div>
        <Link
          href="/requerimentos/novo"
          className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
        >
          Novo requerimento
        </Link>
      </div>

      <form className="mt-4 flex flex-wrap items-end gap-3 text-sm" action="/requerimentos">
        <CampoBusca defaultValue={busca} placeholder="Protocolo, município ou solicitante" />
        <div>
          <label htmlFor="filtro-ano" className="block text-xs font-medium text-slate-500">Ano</label>
          <select
            id="filtro-ano"
            name="ano"
            defaultValue={anoParam ?? String(anoAtual)}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="todos">Todos os anos</option>
            {anosDisponiveis.map((a) => (
              <option key={a} value={a}>
                {a}
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
          Erro ao carregar requerimentos: {error.message}
        </p>
      )}
      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <div className="mt-6">
        <RequerimentosTabela
          requerimentos={(requerimentos ?? []).map((r) => ({
            ...r,
            pessoas: r.pessoas as unknown as { nome: string } | null,
          }))}
          podeGerenciarSempre={podeGerenciarSempre}
          minhaPessoaId={minhaPessoa?.id ?? null}
        />
      </div>

      <Paginacao
        pagina={pagina}
        totalPaginas={totalDePaginas(count)}
        count={count}
        baseHref="/requerimentos"
        paramsBase={paramsBase}
      />
    </div>
  );
}
