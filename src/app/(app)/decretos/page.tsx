import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { formatarData } from "@/lib/pdf/formato";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { MenuAcoes } from "@/components/menu-acoes";
import { CampoBusca } from "@/components/campo-busca";
import { Paginacao } from "@/components/paginacao";
import { construirFiltroBusca } from "@/lib/busca";
import { calcularPagina, totalDePaginas } from "@/lib/paginacao";
import { excluirDecretoTituloHonorario } from "./actions";

export default async function DecretosPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; busca?: string; pagina?: string; error?: string }>;
}) {
  const { ano, busca, pagina: paginaStr, error: errorMsg } = await searchParams;
  const usuario = await getCurrentUsuario();
  const podeGerenciar = usuario?.papel === "admin" || usuario?.papel === "ordenador_despesa";

  const supabase = await createClient();
  const { pagina, de, ate } = calcularPagina(paginaStr);

  let query = supabase
    .from("decretos_titulo_honorario")
    .select("id, numero, ano, data_decreto, nome_homenageado, autor_nome, autor_partido", {
      count: "exact",
    })
    .order("ano", { ascending: false })
    .order("numero", { ascending: false })
    .range(de, ate);

  if (ano) query = query.eq("ano", Number(ano));
  if (busca) query = query.or(construirFiltroBusca(busca, ["nome_homenageado", "autor_nome"]));

  const { data: decretos, error, count } = await query;

  const { data: todosAnos } = await supabase
    .from("decretos_titulo_honorario")
    .select("ano")
    .order("ano", { ascending: false });
  const anosDisponiveis = Array.from(new Set((todosAnos ?? []).map((a) => a.ano)));

  const paramsBase = new URLSearchParams({
    ...(ano ? { ano } : {}),
    ...(busca ? { busca } : {}),
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Decretos — Título de Cidadão Honorário</h1>
          <p className="mt-1 text-sm text-slate-500">
            Redação padronizada dos projetos de decreto legislativo de título de cidadão honorário.
          </p>
        </div>
        {podeGerenciar && (
          <Link
            href="/decretos/novo"
            className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
          >
            Novo decreto
          </Link>
        )}
      </div>

      <form className="mt-4 flex flex-wrap items-end gap-3 text-sm" action="/decretos">
        <CampoBusca defaultValue={busca} placeholder="Homenageado ou autor" />
        <div>
          <label htmlFor="filtro-ano" className="block text-xs font-medium text-slate-500">Ano</label>
          <select
            id="filtro-ano"
            name="ano"
            defaultValue={ano ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
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
          Erro ao carregar decretos: {error.message}
        </p>
      )}
      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Nº</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Data</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Homenageado</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Autor</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {decretos?.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-900">
                  {d.numero}/{d.ano}
                </td>
                <td className="px-4 py-2 text-slate-700">{formatarData(d.data_decreto)}</td>
                <td className="px-4 py-2 text-slate-700">{d.nome_homenageado}</td>
                <td className="px-4 py-2 text-slate-700">
                  {d.autor_nome}
                  {d.autor_partido && ` – ${d.autor_partido}`}
                </td>
                <td className="px-4 py-2">
                  <MenuAcoes>
                    <DownloadPdfButton
                      variant="menu"
                      url={`/api/decretos/${d.id}/pdf`}
                      nomeArquivoPadrao={`decreto-titulo-honorario-${d.numero}-${d.ano}.pdf`}
                    />
                    {podeGerenciar && (
                      <>
                        <Link
                          href={`/decretos/${d.id}/editar`}
                          className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Editar
                        </Link>
                        <ExcluirSolicitacaoButton
                          variant="menu"
                          action={excluirDecretoTituloHonorario.bind(null, d.id)}
                          mensagemConfirmacao={`Tem certeza que deseja excluir o decreto ${d.numero}/${d.ano} (${d.nome_homenageado})? Essa ação não pode ser desfeita.`}
                        />
                      </>
                    )}
                  </MenuAcoes>
                </td>
              </tr>
            ))}
            {decretos?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Nenhum decreto encontrado.
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
        baseHref="/decretos"
        paramsBase={paramsBase}
      />
    </div>
  );
}
