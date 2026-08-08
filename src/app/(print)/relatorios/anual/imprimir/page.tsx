import { createClient } from "@/lib/supabase/server";
import { formatarMoeda } from "@/lib/pdf/formato";
import { calcularRelatorioAnual } from "@/lib/relatorios/anual";
import { PrintButton } from "../../../print-button";
import type { StatusRequerimentoInterno, StatusRequerimentoReembolso } from "@/lib/supabase/database.types";

const STATUS_LABEL: Record<StatusRequerimentoInterno | StatusRequerimentoReembolso, string> = {
  pendente: "Pendente",
  analise: "Em análise",
  deferido: "Deferido",
  indeferido: "Indeferido",
};

export default async function ImprimirRelatorioAnualPage({
  searchParams,
}: {
  searchParams: Promise<{ ano?: string }>;
}) {
  const { ano: anoParam } = await searchParams;
  const ano = Number(anoParam) || new Date().getFullYear();

  const supabase = await createClient();
  const relatorio = await calcularRelatorioAnual(supabase, ano);

  const geradoEm = new Date().toLocaleString("pt-BR");

  return (
    <>
      <PrintButton url={`/api/relatorios/anual/pdf?ano=${ano}`} nomeArquivoPadrao={`relatorio-anual-${ano}.pdf`} />
      <div className="mx-auto w-[210mm] bg-white p-10 text-black print:w-full print:p-8">
        <h1 className="text-lg font-semibold">Relatório Anual {ano} — Câmara Municipal de Nepomuceno</h1>
        <p className="mt-1 text-xs text-slate-500">Gerado em {geradoEm}</p>

        <h2 className="mt-8 text-sm font-semibold">Diárias</h2>
        <div className="mt-2 grid grid-cols-4 gap-3 text-sm">
          <div className="rounded border border-slate-300 p-3">
            <p className="text-xs text-slate-500">Solicitadas</p>
            <p className="mt-1 text-xl font-semibold">{relatorio.diarias.solicitadas}</p>
          </div>
          <div className="rounded border border-slate-300 p-3">
            <p className="text-xs text-slate-500">Autorizadas</p>
            <p className="mt-1 text-xl font-semibold">{relatorio.diarias.autorizadas}</p>
          </div>
          <div className="rounded border border-slate-300 p-3">
            <p className="text-xs text-slate-500">Indeferidas</p>
            <p className="mt-1 text-xl font-semibold">{relatorio.diarias.indeferidas}</p>
          </div>
          <div className="rounded border border-slate-300 p-3">
            <p className="text-xs text-slate-500">Valor total autorizado</p>
            <p className="mt-1 text-xl font-semibold">{formatarMoeda(relatorio.diarias.valorAutorizado)}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-600">
          Prestação de contas: {relatorio.diarias.prestacaoConcluida} concluída(s), {relatorio.diarias.prestacaoPendente} em aberto.
        </p>

        <h2 className="mt-8 text-sm font-semibold">Reembolsos</h2>
        <div className="mt-2 grid grid-cols-5 gap-3 text-sm">
          <div className="rounded border border-slate-300 p-3">
            <p className="text-xs text-slate-500">Total</p>
            <p className="mt-1 text-xl font-semibold">{relatorio.reembolsos.total}</p>
          </div>
          {(Object.keys(relatorio.reembolsos.porStatus) as StatusRequerimentoReembolso[]).map((s) => (
            <div key={s} className="rounded border border-slate-300 p-3">
              <p className="text-xs text-slate-500">{STATUS_LABEL[s]}</p>
              <p className="mt-1 text-xl font-semibold">{relatorio.reembolsos.porStatus[s]}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-600">
          Valor total deferido: {formatarMoeda(relatorio.reembolsos.valorDeferido)}.
        </p>

        <h2 className="mt-8 text-sm font-semibold">Requerimentos Internos</h2>
        <div className="mt-2 grid grid-cols-5 gap-3 text-sm">
          <div className="rounded border border-slate-300 p-3">
            <p className="text-xs text-slate-500">Total</p>
            <p className="mt-1 text-xl font-semibold">{relatorio.requerimentosInternos.total}</p>
          </div>
          {(Object.keys(relatorio.requerimentosInternos.porStatus) as StatusRequerimentoInterno[]).map((s) => (
            <div key={s} className="rounded border border-slate-300 p-3">
              <p className="text-xs text-slate-500">{STATUS_LABEL[s]}</p>
              <p className="mt-1 text-xl font-semibold">{relatorio.requerimentosInternos.porStatus[s]}</p>
            </div>
          ))}
        </div>

        <h2 className="mt-8 text-sm font-semibold">Diárias por solicitante</h2>
        <table className="mt-2 w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-400 text-left">
              <th className="py-1 pr-2">Solicitante</th>
              <th className="py-1 pr-2">Total</th>
              <th className="py-1 pr-2">Autorizadas</th>
              <th className="py-1 pr-2">Valor autorizado</th>
            </tr>
          </thead>
          <tbody>
            {relatorio.ranking.map((r) => (
              <tr key={r.nome} className="border-b border-slate-200">
                <td className="py-1 pr-2">{r.nome}</td>
                <td className="py-1 pr-2">{r.total}</td>
                <td className="py-1 pr-2">{r.autorizadas}</td>
                <td className="py-1 pr-2">{formatarMoeda(r.valorAutorizado)}</td>
              </tr>
            ))}
            {relatorio.ranking.length === 0 && (
              <tr>
                <td colSpan={4} className="py-2 text-center text-slate-400">
                  Nenhuma solicitação em {ano}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
