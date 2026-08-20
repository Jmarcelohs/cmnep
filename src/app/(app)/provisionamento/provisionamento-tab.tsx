"use client";

import { formatarMoeda } from "@/lib/pdf/formato";
import { gerarAlertas, provisionamentoMensalContrato, totalAnualContrato } from "@/lib/provisionamento/calculo";
import type { Contrato } from "@/lib/provisionamento/tipos";

const NOMES_MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

export function ProvisionamentoTab({
  contratos,
  ano,
  onAlterarAno,
}: {
  contratos: Contrato[];
  ano: number;
  onAlterarAno: (ano: number) => void;
}) {
  const alertas = gerarAlertas(contratos, ano);

  const totaisPorMes = Array.from({ length: 12 }, (_, i) =>
    contratos.reduce((soma, c) => soma + provisionamentoMensalContrato(c, ano)[i], 0),
  );
  const totalGeral = totaisPorMes.reduce((soma, v) => soma + v, 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2">
          <label htmlFor="ano-provisionamento" className="text-sm font-medium text-slate-700">
            Ano de referência
          </label>
          <input
            id="ano-provisionamento"
            type="number"
            value={ano}
            onChange={(e) => onAlterarAno(Number(e.target.value) || ano)}
            className="w-24 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          disabled={contratos.length === 0}
          className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          Imprimir / gerar PDF
        </button>
      </div>

      <h2 className="mt-4 hidden text-lg font-semibold text-brand-navy print:block">
        Provisionamento Orçamentário {ano} — Câmara Municipal de Nepomuceno/MG
      </h2>

      {alertas.length > 0 && (
        <div className="mt-4 space-y-2 print:hidden">
          {alertas.map((a, i) => (
            <p
              key={`${a.contratoId}-${i}`}
              className={`rounded-md px-3 py-2 text-sm ${
                a.tipo === "sem_renovacao" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {a.mensagem}
            </p>
          ))}
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 print:overflow-visible print:border-0">
        <table className="min-w-full divide-y divide-slate-200 text-xs print:text-[8pt]">
          <thead className="bg-brand-navy/5 print:bg-transparent">
            <tr>
              <th className="sticky left-0 bg-brand-navy/5 px-3 py-2 text-left font-medium text-slate-600 print:static print:bg-transparent">
                Contrato
              </th>
              <th className="px-2 py-2 text-left font-medium text-slate-600">Ficha</th>
              {NOMES_MESES.map((m) => (
                <th key={m} className="px-2 py-2 text-right font-medium text-slate-600">
                  {m}
                </th>
              ))}
              <th className="px-2 py-2 text-right font-medium text-slate-600">Total {ano}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contratos.map((c) => {
              const valoresMensais = provisionamentoMensalContrato(c, ano);
              return (
                <tr key={c.id} className="hover:bg-slate-50 print:hover:bg-transparent">
                  <td className="sticky left-0 bg-white px-3 py-2 text-slate-900 print:static">{c.nome}</td>
                  <td className="px-2 py-2 text-slate-700">{c.fichaOrcamentaria || c.dotacao || "—"}</td>
                  {valoresMensais.map((v, i) => (
                    <td key={i} className="px-2 py-2 text-right text-slate-700">
                      {v > 0 ? formatarMoeda(v) : "—"}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-right font-semibold text-slate-900">
                    {formatarMoeda(totalAnualContrato(c, ano))}
                  </td>
                </tr>
              );
            })}
            {contratos.length === 0 && (
              <tr>
                <td colSpan={15} className="px-4 py-6 text-center text-slate-400">
                  Nenhum contrato cadastrado ainda — cadastre na aba Contratos.
                </td>
              </tr>
            )}
          </tbody>
          {contratos.length > 0 && (
            <tfoot className="border-t-2 border-slate-300 font-semibold">
              <tr>
                <td className="sticky left-0 bg-white px-3 py-2 text-slate-900 print:static">Total</td>
                <td className="px-2 py-2" />
                {totaisPorMes.map((v, i) => (
                  <td key={i} className="px-2 py-2 text-right text-slate-900">
                    {formatarMoeda(v)}
                  </td>
                ))}
                <td className="px-2 py-2 text-right text-slate-900">{formatarMoeda(totalGeral)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
