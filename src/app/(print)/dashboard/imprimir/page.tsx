import { createClient } from "@/lib/supabase/server";
import { formatarData, formatarMoeda } from "@/lib/pdf/formato";
import { calcularRankingSolicitantes } from "@/lib/dashboard/ranking";
import { PrintButton } from "../../print-button";
import type { StatusRequerimentoInterno } from "@/lib/supabase/database.types";

const STATUS_INTERNO_LABEL: Record<StatusRequerimentoInterno, string> = {
  pendente: "Pendente",
  analise: "Em análise",
  deferido: "Deferido",
  indeferido: "Indeferido",
};

export default async function ImprimirPainelPage() {
  const supabase = await createClient();

  const { data: solicitacoes } = await supabase
    .from("diarias_solicitacoes")
    .select("status, total");
  const lista = solicitacoes ?? [];

  const solicitadas = lista.filter((s) => s.status === "Solicitado").length;
  const autorizadas = lista.filter((s) => s.status === "Autorizado").length;
  const indeferidas = lista.filter((s) => s.status === "Indeferido").length;
  const valorAutorizado = lista
    .filter((s) => s.status === "Autorizado")
    .reduce((acc, s) => acc + Number(s.total ?? 0), 0);

  const ranking = await calcularRankingSolicitantes(supabase);

  const { data: requerimentosInternos } = await supabase
    .from("requerimentos_internos")
    .select("status");
  const contagemStatusInterno: Record<StatusRequerimentoInterno, number> = {
    pendente: 0,
    analise: 0,
    deferido: 0,
    indeferido: 0,
  };
  for (const r of requerimentosInternos ?? []) {
    contagemStatusInterno[r.status as StatusRequerimentoInterno]++;
  }

  const geradoEm = new Date().toLocaleString("pt-BR");

  return (
    <>
      <PrintButton url="/api/dashboard/pdf" nomeArquivoPadrao="relatorio-painel.pdf" />
      <div className="mx-auto w-[210mm] bg-white p-10 text-black print:w-full print:p-8">
        <h1 className="text-lg font-semibold">Relatório do Painel — Câmara Municipal de Nepomuceno</h1>
        <p className="mt-1 text-xs text-slate-500">Gerado em {geradoEm}</p>

        <div className="mt-6 grid grid-cols-4 gap-3 text-sm">
          <div className="rounded border border-slate-300 p-3">
            <p className="text-xs text-slate-500">Pendentes de autorização</p>
            <p className="mt-1 text-xl font-semibold">{solicitadas}</p>
          </div>
          <div className="rounded border border-slate-300 p-3">
            <p className="text-xs text-slate-500">Autorizadas</p>
            <p className="mt-1 text-xl font-semibold">{autorizadas}</p>
          </div>
          <div className="rounded border border-slate-300 p-3">
            <p className="text-xs text-slate-500">Indeferidas</p>
            <p className="mt-1 text-xl font-semibold">{indeferidas}</p>
          </div>
          <div className="rounded border border-slate-300 p-3">
            <p className="text-xs text-slate-500">Valor total autorizado</p>
            <p className="mt-1 text-xl font-semibold">{formatarMoeda(valorAutorizado)}</p>
          </div>
        </div>

        <h2 className="mt-8 text-sm font-semibold">Diárias por solicitante</h2>
        <table className="mt-2 w-full border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-400 text-left">
              <th className="py-1 pr-2">Solicitante</th>
              <th className="py-1 pr-2">Nº diária</th>
              <th className="py-1 pr-2">Nº solicitação</th>
              <th className="py-1 pr-2">Última solicitação</th>
              <th className="py-1 pr-2">Total</th>
              <th className="py-1 pr-2">Autorizadas</th>
              <th className="py-1 pr-2">Valor autorizado</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((r) => (
              <tr key={r.nome} className="border-b border-slate-200">
                <td className="py-1 pr-2">{r.nome}</td>
                <td className="py-1 pr-2">{r.numeroDiaria ?? "—"}</td>
                <td className="py-1 pr-2">{r.numeroSolicitacao ?? "—"}</td>
                <td className="py-1 pr-2">{formatarData(r.ultimaSolicitacao)}</td>
                <td className="py-1 pr-2">{r.total}</td>
                <td className="py-1 pr-2">{r.autorizadas}</td>
                <td className="py-1 pr-2">{formatarMoeda(r.valorAutorizado)}</td>
              </tr>
            ))}
            {ranking.length === 0 && (
              <tr>
                <td colSpan={7} className="py-2 text-center text-slate-400">
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <h2 className="mt-8 text-sm font-semibold">Requerimentos Internos</h2>
        <div className="mt-2 grid grid-cols-4 gap-3 text-sm">
          {(Object.keys(STATUS_INTERNO_LABEL) as StatusRequerimentoInterno[]).map((s) => (
            <div key={s} className="rounded border border-slate-300 p-3">
              <p className="text-xs text-slate-500">{STATUS_INTERNO_LABEL[s]}</p>
              <p className="mt-1 text-xl font-semibold">{contagemStatusInterno[s]}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
