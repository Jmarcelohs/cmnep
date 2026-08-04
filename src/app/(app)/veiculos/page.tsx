import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { formatarData, formatarMoeda } from "@/lib/pdf/formato";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { MenuAcoes } from "@/components/menu-acoes";
import { excluirLocacao } from "./actions";

export default async function VeiculosPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string; solicitante?: string; error?: string }>;
}) {
  const { ano, solicitante, error: errorMsg } = await searchParams;
  const usuario = await getCurrentUsuario();
  const podeGerenciar =
    usuario?.papel === "admin" ||
    usuario?.papel === "ordenador_despesa" ||
    usuario?.papel === "gestor_diarias";

  const supabase = await createClient();

  let query = supabase
    .from("veiculos_locacao_solicitacoes")
    .select("id, numero, ano, data_pedido, solicitante_nome, condutor_nome, veiculo_descricao, valor_total, locadora")
    .order("ano", { ascending: false })
    .order("numero", { ascending: false });

  if (ano) query = query.eq("ano", Number(ano));
  if (solicitante) query = query.ilike("solicitante_nome", `%${solicitante}%`);

  const { data: locacoes, error } = await query;

  const { data: todosAnos } = await supabase
    .from("veiculos_locacao_solicitacoes")
    .select("ano")
    .order("ano", { ascending: false });
  const anosDisponiveis = Array.from(new Set((todosAnos ?? []).map((a) => a.ano)));

  const total = (locacoes ?? []).reduce((acc, l) => acc + Number(l.valor_total), 0);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Locação de Veículos</h1>
          <p className="mt-1 text-sm text-slate-500">
            Pregão nº 003/2026 (Processo PRC011) — Locadora LOCAMAR LTDA.
          </p>
        </div>
        {podeGerenciar && (
          <Link
            href="/veiculos/novo"
            className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
          >
            Nova solicitação
          </Link>
        )}
      </div>

      <form className="mt-4 flex flex-wrap items-end gap-3 text-sm" action="/veiculos">
        <div>
          <label className="block text-xs font-medium text-slate-500">Ano</label>
          <select
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
        <div>
          <label className="block text-xs font-medium text-slate-500">Solicitante</label>
          <input
            name="solicitante"
            defaultValue={solicitante ?? ""}
            placeholder="Buscar por nome"
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Filtrar
        </button>
        <a
          href={`/api/veiculos/csv?${new URLSearchParams({
            ...(ano ? { ano } : {}),
            ...(solicitante ? { solicitante } : {}),
          }).toString()}`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Exportar CSV
        </a>
        <span className="ml-auto text-sm font-medium text-slate-700">
          Total do filtro: {formatarMoeda(total)}
        </span>
      </form>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Erro ao carregar solicitações: {error.message}
        </p>
      )}
      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Nº</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Data</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Solicitante</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Condutor</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Veículo</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Valor</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {locacoes?.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-900">
                  {l.numero}/{l.ano}
                </td>
                <td className="px-4 py-2 text-slate-700">{formatarData(l.data_pedido)}</td>
                <td className="px-4 py-2 text-slate-700">{l.solicitante_nome}</td>
                <td className="px-4 py-2 text-slate-700">{l.condutor_nome}</td>
                <td className="px-4 py-2 text-slate-700">{l.veiculo_descricao}</td>
                <td className="px-4 py-2 text-slate-700">{formatarMoeda(l.valor_total)}</td>
                <td className="px-4 py-2">
                  <MenuAcoes>
                    <DownloadPdfButton
                      variant="menu"
                      url={`/api/veiculos/${l.id}/pdf`}
                      nomeArquivoPadrao={`locacao-veiculo-${l.numero}-${l.ano}.pdf`}
                    />
                    <DownloadPdfButton
                      variant="menu"
                      url={`/api/veiculos/${l.id}/imagem`}
                      nomeArquivoPadrao={`locacao-veiculo-${l.numero}-${l.ano}.png`}
                      label="Baixar imagem"
                    />
                    {podeGerenciar && (
                      <>
                        <Link
                          href={`/veiculos/${l.id}/editar`}
                          className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Editar
                        </Link>
                        <ExcluirSolicitacaoButton
                          variant="menu"
                          action={excluirLocacao.bind(null, l.id)}
                          mensagemConfirmacao={`Tem certeza que deseja excluir a solicitação ${l.numero}/${l.ano}? Essa ação não pode ser desfeita.`}
                        />
                      </>
                    )}
                  </MenuAcoes>
                </td>
              </tr>
            ))}
            {locacoes?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
