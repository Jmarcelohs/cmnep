import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import type { PeriodoAvaliacao } from "@/lib/supabase/database.types";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { excluirAvaliacao } from "./actions";

const PERIODOS: { value: PeriodoAvaliacao; label: string }[] = [
  { value: "trimestre_1", label: "1º Trimestre" },
  { value: "trimestre_2", label: "2º Trimestre" },
  { value: "trimestre_3", label: "3º Trimestre" },
  { value: "anual", label: "Final" },
];

export default async function AvaliacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ano?: string; busca?: string }>;
}) {
  const { error: errorMsg, ano: anoParam, busca } = await searchParams;
  const usuario = await getCurrentUsuario();
  const ehAdmin = usuario?.papel === "admin";
  const ano = Number(anoParam) || new Date().getFullYear();

  const supabase = await createClient();

  const { data: avaliacoesAno, error } = await supabase
    .from("avaliacoes")
    .select("id, pessoa_id, periodo, nota_final, pessoas(nome, matricula)")
    .eq("ano", ano)
    .order("periodo");

  const { data: pessoas } = ehAdmin
    ? await supabase
        .from("pessoas")
        .select("id, nome, matricula")
        .eq("categoria", "Efetivo")
        .eq("ativo", true)
        .order("nome")
    : { data: null };

  type LinhaPessoa = { id: string; nome: string; matricula: string | null };

  const todasLinhas: LinhaPessoa[] =
    pessoas ??
    Array.from(
      new Map(
        (avaliacoesAno ?? []).map((a) => {
          const p = a.pessoas as unknown as { nome: string; matricula: string | null } | null;
          return [a.pessoa_id, { id: a.pessoa_id, nome: p?.nome ?? "—", matricula: p?.matricula ?? null }];
        }),
      ).values(),
    );

  const linhas = busca
    ? todasLinhas.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()))
    : todasLinhas;

  const porPessoaPeriodo = new Map<string, { id: string; nota_final: number | null }>();
  for (const a of avaliacoesAno ?? []) {
    porPessoaPeriodo.set(`${a.pessoa_id}-${a.periodo}`, { id: a.id, nota_final: a.nota_final });
  }

  const pendencias = ehAdmin
    ? todasLinhas.flatMap((p) =>
        PERIODOS.filter((periodo) => !porPessoaPeriodo.has(`${p.id}-${periodo.value}`)).map((periodo) => ({
          pessoa: p,
          periodo,
        })),
      )
    : [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Avaliações de Desempenho</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ciclo de 3 avaliações trimestrais + 1 anual por servidor/ano.
          </p>
        </div>
        {ehAdmin && (
          <div className="flex items-center gap-3">
            <Link
              href="/avaliacoes/avaliadores"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Avaliadores
            </Link>
            <Link
              href="/avaliacoes/novo"
              className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
            >
              Nova avaliação
            </Link>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Erro ao carregar avaliações: {error.message}
        </p>
      )}
      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <form className="mt-6 flex flex-wrap items-center gap-2 text-sm">
        <label className="font-medium text-slate-700" htmlFor="ano">
          Ano
        </label>
        <input
          id="ano"
          name="ano"
          type="number"
          defaultValue={ano}
          className="w-28 rounded-md border border-slate-300 px-3 py-2"
        />
        <input
          type="text"
          name="busca"
          defaultValue={busca ?? ""}
          placeholder="Buscar por nome"
          className="rounded-md border border-slate-300 px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          Filtrar
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Servidor(a)</th>
              {PERIODOS.map((p) => (
                <th key={p.value} className="px-4 py-2 text-center font-medium text-slate-500">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {linhas.map((pessoa) => (
              <tr key={pessoa.id}>
                <td className="px-4 py-2 text-slate-900">
                  <Link href={`/avaliacoes/servidor/${pessoa.id}`} className="hover:underline">
                    {pessoa.nome}
                  </Link>
                  {pessoa.matricula && <span className="text-slate-400"> (mat. {pessoa.matricula})</span>}
                </td>
                {PERIODOS.map((periodo) => {
                  const lancada = porPessoaPeriodo.get(`${pessoa.id}-${periodo.value}`);
                  return (
                    <td key={periodo.value} className="px-4 py-2 text-center">
                      {lancada ? (
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/avaliacoes/${lancada.id}`} className="text-brand-navy hover:underline">
                            {lancada.nota_final?.toFixed(1) ?? "—"}
                          </Link>
                          {ehAdmin && (
                            <ExcluirSolicitacaoButton
                              action={excluirAvaliacao.bind(null, lancada.id)}
                              mensagemConfirmacao="Tem certeza que deseja excluir essa avaliação?"
                            />
                          )}
                        </div>
                      ) : ehAdmin ? (
                        <Link
                          href={`/avaliacoes/novo?pessoa_id=${pessoa.id}`}
                          className="text-xs text-amber-600 hover:underline"
                        >
                          Lançar
                        </Link>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={PERIODOS.length + 1} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma avaliação encontrada para {ano}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {ehAdmin && pendencias.length > 0 && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-800">
            Pendências em {ano} ({pendencias.length})
          </p>
          <ul className="mt-2 space-y-1 text-sm text-amber-800">
            {pendencias.map(({ pessoa, periodo }) => (
              <li key={`${pessoa.id}-${periodo.value}`}>
                <Link href={`/avaliacoes/novo?pessoa_id=${pessoa.id}`} className="hover:underline">
                  {pessoa.nome} — {periodo.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
