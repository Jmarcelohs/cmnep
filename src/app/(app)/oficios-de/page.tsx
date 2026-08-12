import Link from "next/link";
import { redirect } from "next/navigation";
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
import { excluirOficioDE } from "./actions";

export default async function OficiosDEPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; busca?: string; pagina?: string; error?: string }>;
}) {
  const { ano, busca, pagina: paginaStr, error: errorMsg } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { pagina, de, ate } = calcularPagina(paginaStr);

  let query = supabase
    .from("oficios_diretor_executivo")
    .select("id, numero, ano, data_oficio, destinatario_nome, assunto", { count: "exact" })
    .order("ano", { ascending: false })
    .order("numero", { ascending: false })
    .range(de, ate);

  if (ano) query = query.eq("ano", Number(ano));
  if (busca) query = query.or(construirFiltroBusca(busca, ["destinatario_nome", "assunto"]));

  const { data: oficios, error, count } = await query;

  const { data: todosAnos } = await supabase
    .from("oficios_diretor_executivo")
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
          <h1 className="text-xl font-semibold text-brand-navy">Ofícios — Diretor Executivo</h1>
          <p className="mt-1 text-sm text-slate-500">
            Ofícios assinados pelo Diretor Executivo da Câmara, no timbrado próprio (OFÍCIO Nº
            X/ANO/DE/CMN).
          </p>
        </div>
        <Link
          href="/oficios-de/novo"
          className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
        >
          Novo ofício
        </Link>
      </div>

      <form className="mt-4 flex flex-wrap items-end gap-3 text-sm" action="/oficios-de">
        <CampoBusca defaultValue={busca} placeholder="Destinatário ou assunto" />
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
          Erro ao carregar ofícios: {error.message}
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
              <th className="px-4 py-2 text-left font-medium text-slate-600">Destinatário</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Assunto</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {oficios?.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-900">
                  {o.numero}/{o.ano}
                </td>
                <td className="px-4 py-2 text-slate-700">{formatarData(o.data_oficio)}</td>
                <td className="px-4 py-2 text-slate-700">{o.destinatario_nome}</td>
                <td className="px-4 py-2 max-w-xs truncate text-slate-700">{o.assunto}</td>
                <td className="px-4 py-2">
                  <MenuAcoes>
                    <DownloadPdfButton
                      variant="menu"
                      url={`/api/oficios-de/${o.id}/pdf`}
                      nomeArquivoPadrao={`oficio-de-${o.numero}-${o.ano}.pdf`}
                    />
                    <Link
                      href={`/oficios-de/${o.id}/editar`}
                      className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Editar
                    </Link>
                    <ExcluirSolicitacaoButton
                      variant="menu"
                      action={excluirOficioDE.bind(null, o.id)}
                      mensagemConfirmacao={`Tem certeza que deseja excluir o ofício ${o.numero}/${o.ano} (${o.destinatario_nome})? Essa ação não pode ser desfeita.`}
                    />
                  </MenuAcoes>
                </td>
              </tr>
            ))}
            {oficios?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Nenhum ofício encontrado.
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
        baseHref="/oficios-de"
        paramsBase={paramsBase}
      />
    </div>
  );
}
