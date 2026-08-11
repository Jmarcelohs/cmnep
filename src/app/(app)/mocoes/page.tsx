import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { formatarData } from "@/lib/pdf/formato";
import { LABEL_TIPO_MOCAO } from "@/lib/mocoes/documento";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { MenuAcoes } from "@/components/menu-acoes";
import { CampoBusca } from "@/components/campo-busca";
import { Paginacao } from "@/components/paginacao";
import { construirFiltroBusca } from "@/lib/busca";
import { calcularPagina, totalDePaginas } from "@/lib/paginacao";
import { excluirMocao } from "./actions";
import type { TipoMocao } from "@/lib/supabase/database.types";

const ESTILO_TIPO: Record<TipoMocao, string> = {
  louvor: "bg-sky-50 text-sky-700",
  congratulacoes: "bg-emerald-50 text-emerald-700",
  pesar: "bg-slate-100 text-slate-700",
  repudio: "bg-red-50 text-red-700",
};

export default async function MocoesPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; busca?: string; pagina?: string; error?: string }>;
}) {
  const { tipo, busca, pagina: paginaStr, error: errorMsg } = await searchParams;
  const usuario = await getCurrentUsuario();
  const podeGerenciar = usuario?.papel === "admin" || usuario?.papel === "ordenador_despesa";
  const podeCriar =
    podeGerenciar || usuario?.papel === "servidor" || usuario?.papel === "estagiario";

  const supabase = await createClient();
  const { pagina, de, ate } = calcularPagina(paginaStr);

  let query = supabase
    .from("mocoes")
    .select(
      "id, tipo, data_mocao, destinatario, autor:autor_vereador_id(nome, partido)",
      { count: "exact" },
    )
    .order("data_mocao", { ascending: false })
    .range(de, ate);

  if (tipo) query = query.eq("tipo", tipo as TipoMocao);
  // Autor não é mais texto livre (vem do cadastro de Vereadores via
  // join) — a busca aqui cobre só o destinatário.
  if (busca) query = query.or(construirFiltroBusca(busca, ["destinatario"]));

  const { data: mocoes, error, count } = await query;

  const paramsBase = new URLSearchParams({
    ...(tipo ? { tipo } : {}),
    ...(busca ? { busca } : {}),
  });
  const paramsCsv = new URLSearchParams({
    ...(tipo ? { tipo } : {}),
  }).toString();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Moções</h1>
          <p className="mt-1 text-sm text-slate-500">
            Honrarias apresentadas por vereadores e votadas em plenário — aplauso/congratulações,
            pesar/condolências, repúdio ou apoio.
          </p>
        </div>
        {podeCriar && (
          <div className="flex gap-2">
            <Link
              href="/mocoes/lote"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Criar em lote
            </Link>
            <Link
              href="/mocoes/novo"
              className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
            >
              Nova moção
            </Link>
          </div>
        )}
      </div>

      <form className="mt-4 flex flex-wrap items-end gap-3 text-sm" action="/mocoes">
        <CampoBusca defaultValue={busca} placeholder="Destinatário ou autor" />
        <div>
          <label htmlFor="filtro-tipo" className="block text-xs font-medium text-slate-500">Tipo</label>
          <select
            id="filtro-tipo"
            name="tipo"
            defaultValue={tipo ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {(Object.keys(LABEL_TIPO_MOCAO) as TipoMocao[]).map((t) => (
              <option key={t} value={t}>
                {LABEL_TIPO_MOCAO[t]}
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
          href={`/api/mocoes/csv?${paramsCsv}`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Exportar CSV
        </a>
      </form>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Erro ao carregar moções: {error.message}
        </p>
      )}
      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Data</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Tipo</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Destinatário</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Autor</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mocoes?.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-700">{formatarData(m.data_mocao)}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${ESTILO_TIPO[m.tipo as TipoMocao]}`}
                  >
                    {LABEL_TIPO_MOCAO[m.tipo as TipoMocao]}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-700">{m.destinatario}</td>
                <td className="px-4 py-2 text-slate-700">
                  {m.autor?.nome ?? "—"}
                  {m.autor?.partido && ` – ${m.autor.partido}`}
                </td>
                <td className="px-4 py-2">
                  <MenuAcoes>
                    <DownloadPdfButton
                      variant="menu"
                      url={`/api/mocoes/${m.id}/pdf`}
                      nomeArquivoPadrao={`mocao-${m.id}.pdf`}
                    />
                    <DownloadPdfButton
                      variant="menu"
                      url={`/api/mocoes/${m.id}/docx`}
                      nomeArquivoPadrao={`mocao-${m.id}.docx`}
                      label="Baixar Word"
                    />
                    {podeGerenciar && (
                      <>
                        <Link
                          href={`/mocoes/${m.id}/editar`}
                          className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Editar
                        </Link>
                        <ExcluirSolicitacaoButton
                          variant="menu"
                          action={excluirMocao.bind(null, m.id)}
                          mensagemConfirmacao={`Tem certeza que deseja excluir a moção para "${m.destinatario}"? Essa ação não pode ser desfeita.`}
                        />
                      </>
                    )}
                  </MenuAcoes>
                </td>
              </tr>
            ))}
            {mocoes?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma moção encontrada.
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
        baseHref="/mocoes"
        paramsBase={paramsBase}
      />
    </div>
  );
}
