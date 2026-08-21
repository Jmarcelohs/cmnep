"use client";

import { formatarMoeda } from "@/lib/pdf/formato";
import { consolidarPorDotacao } from "@/lib/provisionamento/calculo";
import { baixarArquivo, montarCsv } from "@/lib/provisionamento/csv";
import type { Contrato } from "@/lib/provisionamento/tipos";

export function DotacaoTab({ contratos, ano }: { contratos: Contrato[]; ano: number }) {
  const grupos = consolidarPorDotacao(contratos, ano);
  const totalGeral = grupos.reduce((soma, g) => soma + g.totalAnual, 0);

  function exportarCsv() {
    const cabecalho = ["Ficha", "Nº de contratos", `Total ${ano}`];
    const linhas = grupos.map((g) => [g.chave, g.contratos.length, g.totalAnual.toFixed(2)]);
    baixarArquivo(`provisionamento-por-dotacao-${ano}.csv`, montarCsv(cabecalho, linhas), "text/csv;charset=utf-8");
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          Consolidado {ano} por ficha orçamentária — número de referência pra preencher o rascunho
          da LOA.
        </p>
        <button
          type="button"
          onClick={exportarCsv}
          disabled={grupos.length === 0}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Exportar CSV
        </button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Ficha</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Contratos</th>
              <th className="px-4 py-2 text-right font-medium text-slate-600">Total {ano}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {grupos.map((g) => (
              <tr key={g.chave} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-medium text-slate-900">{g.chave}</td>
                <td className="px-4 py-2 text-slate-700">
                  {g.contratos.map((c) => c.nome).join(", ")}
                </td>
                <td className="px-4 py-2 text-right font-semibold text-slate-900">
                  {formatarMoeda(g.totalAnual)}
                </td>
              </tr>
            ))}
            {grupos.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Nenhum contrato cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
          {grupos.length > 0 && (
            <tfoot className="border-t-2 border-slate-300 font-semibold">
              <tr>
                <td className="px-4 py-2 text-slate-900" colSpan={2}>
                  Total geral
                </td>
                <td className="px-4 py-2 text-right text-slate-900">{formatarMoeda(totalGeral)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
