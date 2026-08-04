import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { formatarMoeda } from "@/lib/pdf/formato";
import { SUBASSUNTO_TITULO } from "@/lib/reembolso/documento";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { MenuAcoes } from "@/components/menu-acoes";
import { CampoBusca } from "@/components/campo-busca";
import { Paginacao } from "@/components/paginacao";
import { buscarIdsPessoasPorNome, construirFiltroBusca } from "@/lib/busca";
import { calcularPagina, totalDePaginas } from "@/lib/paginacao";
import { excluirReembolso } from "./actions";
import type { StatusRequerimentoReembolso } from "@/lib/supabase/database.types";

const STATUS_LABEL: Record<StatusRequerimentoReembolso, string> = {
  pendente: "Pendente",
  analise: "Em análise",
  deferido: "Deferido",
  indeferido: "Indeferido",
};

const STATUS_STYLES: Record<StatusRequerimentoReembolso, string> = {
  pendente: "bg-amber-50 text-amber-700",
  analise: "bg-slate-100 text-slate-600",
  deferido: "bg-emerald-50 text-emerald-700",
  indeferido: "bg-red-50 text-red-700",
};

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
          <label className="block text-xs font-medium text-slate-500">Ano</label>
          <select
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

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Protocolo</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Solicitante</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Sub-assunto</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Valor</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requerimentos?.map((r) => {
              const podeExcluir = podeGerenciarSempre || minhaPessoa?.id === r.pessoa_id;
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/requerimentos/${r.id}`} className="block text-slate-900">
                      {r.protocolo}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {(r.pessoas as unknown as { nome: string } | null)?.nome ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-slate-700">
                    {SUBASSUNTO_TITULO[r.subassunto as keyof typeof SUBASSUNTO_TITULO]}
                  </td>
                  <td className="px-4 py-2 text-slate-700">{formatarMoeda(r.valor)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[r.status as StatusRequerimentoReembolso] ?? ""}`}
                    >
                      {STATUS_LABEL[r.status as StatusRequerimentoReembolso] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <MenuAcoes>
                      <Link
                        href={`/requerimentos/${r.id}`}
                        className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Ver
                      </Link>
                      {podeExcluir && (
                        <Link
                          href={`/requerimentos/${r.id}/editar`}
                          className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Editar
                        </Link>
                      )}
                      {podeExcluir && (
                        <ExcluirSolicitacaoButton
                          variant="menu"
                          action={excluirReembolso.bind(null, r.id)}
                          mensagemConfirmacao={`Tem certeza que deseja excluir o requerimento ${r.protocolo}? Essa ação não pode ser desfeita.`}
                        />
                      )}
                    </MenuAcoes>
                  </td>
                </tr>
              );
            })}
            {requerimentos?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Nenhum requerimento cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
