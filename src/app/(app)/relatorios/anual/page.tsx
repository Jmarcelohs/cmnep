import { createClient } from "@/lib/supabase/server";
import { calcularRelatorioAnual } from "@/lib/relatorios/anual";
import { formatarData } from "@/lib/pdf/formato";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import type { StatusRequerimentoInterno, StatusRequerimentoReembolso } from "@/lib/supabase/database.types";

const STATUS_LABEL: Record<StatusRequerimentoInterno | StatusRequerimentoReembolso, string> = {
  pendente: "Pendente",
  analise: "Em análise",
  deferido: "Deferido",
  indeferido: "Indeferido",
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function RelatorioAnualPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const { ano: anoParam } = await searchParams;
  const anoAtual = new Date().getFullYear();
  const ano = Number(anoParam) || anoAtual;

  const supabase = await createClient();

  const [relatorio, { data: datasDiarias }, { data: datasReembolsos }, { data: datasInternos }] =
    await Promise.all([
      calcularRelatorioAnual(supabase, ano),
      supabase.from("diarias_solicitacoes").select("data_solicitacao"),
      supabase.from("requerimentos_reembolso").select("data_requerimento"),
      supabase.from("requerimentos_internos").select("data_requerimento"),
    ]);

  const anosDisponiveis = Array.from(
    new Set([
      anoAtual,
      ...(datasDiarias ?? []).map((d) => Number(d.data_solicitacao?.slice(0, 4))),
      ...(datasReembolsos ?? []).map((d) => Number(d.data_requerimento?.slice(0, 4))),
      ...(datasInternos ?? []).map((d) => Number(d.data_requerimento?.slice(0, 4))),
    ]),
  )
    .filter(Boolean)
    .sort((a, b) => b - a);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Relatório Anual</h1>
          <p className="mt-1 text-sm text-slate-500">
            Diárias, Reembolsos e Requerimentos Internos consolidados em {ano}.
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/api/relatorios/anual/csv?ano=${ano}`}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Exportar CSV
          </a>
          <DownloadPdfButton
            url={`/api/relatorios/anual/pdf?ano=${ano}`}
            nomeArquivoPadrao={`relatorio-anual-${ano}.pdf`}
            label="Exportar PDF"
          />
        </div>
      </div>

      <form className="mt-4 flex items-end gap-3 text-sm" action="/relatorios/anual">
        <div>
          <label htmlFor="filtro-ano" className="block text-xs font-medium text-slate-500">Ano</label>
          <select
            id="filtro-ano"
            name="ano"
            defaultValue={String(ano)}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
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

      <h2 className="mt-8 text-base font-semibold text-slate-900">Diárias</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 border-t-4 border-t-amber-500 bg-white p-4">
          <p className="text-sm text-slate-500">Solicitadas</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600">{relatorio.diarias.solicitadas}</p>
        </div>
        <div className="rounded-lg border border-slate-200 border-t-4 border-t-emerald-500 bg-white p-4">
          <p className="text-sm text-slate-500">Autorizadas</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{relatorio.diarias.autorizadas}</p>
        </div>
        <div className="rounded-lg border border-slate-200 border-t-4 border-t-red-500 bg-white p-4">
          <p className="text-sm text-slate-500">Indeferidas</p>
          <p className="mt-2 text-2xl font-semibold text-red-600">{relatorio.diarias.indeferidas}</p>
        </div>
        <div className="rounded-lg border border-slate-200 border-t-4 border-t-brand-green bg-white p-4">
          <p className="text-sm text-slate-500">Valor total autorizado</p>
          <p className="mt-2 text-2xl font-semibold text-brand-navy">
            {formatarMoeda(relatorio.diarias.valorAutorizado)}
          </p>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">
        Prestação de contas: {relatorio.diarias.prestacaoConcluida} concluída(s), {relatorio.diarias.prestacaoPendente} em aberto.
      </p>

      <h2 className="mt-8 text-base font-semibold text-slate-900">Reembolsos</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{relatorio.reembolsos.total}</p>
        </div>
        {(Object.keys(relatorio.reembolsos.porStatus) as StatusRequerimentoReembolso[]).map((status) => (
          <div key={status} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{STATUS_LABEL[status]}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {relatorio.reembolsos.porStatus[status]}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-slate-600">
        Valor total deferido: {formatarMoeda(relatorio.reembolsos.valorDeferido)}.
      </p>

      <h2 className="mt-8 text-base font-semibold text-slate-900">Requerimentos Internos</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Total</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{relatorio.requerimentosInternos.total}</p>
        </div>
        {(Object.keys(relatorio.requerimentosInternos.porStatus) as StatusRequerimentoInterno[]).map(
          (status) => (
            <div key={status} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">{STATUS_LABEL[status]}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {relatorio.requerimentosInternos.porStatus[status]}
              </p>
            </div>
          ),
        )}
      </div>

      <h2 className="mt-8 text-base font-semibold text-slate-900">Diárias por solicitante</h2>
      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Solicitante</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Última solicitação</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Total de diárias</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Autorizadas</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Valor autorizado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {relatorio.ranking.map((dados) => (
              <tr key={dados.nome}>
                <td className="px-4 py-2 text-slate-900">{dados.nome}</td>
                <td className="px-4 py-2 text-slate-700">{formatarData(dados.ultimaSolicitacao)}</td>
                <td className="px-4 py-2 text-slate-700">{dados.total}</td>
                <td className="px-4 py-2 text-slate-700">{dados.autorizadas}</td>
                <td className="px-4 py-2 text-slate-700">{formatarMoeda(dados.valorAutorizado)}</td>
              </tr>
            ))}
            {relatorio.ranking.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma solicitação em {ano}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
