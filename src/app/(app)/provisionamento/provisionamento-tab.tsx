"use client";

import { formatarMoeda } from "@/lib/pdf/formato";
import { gerarAlertas, provisionamentoMensalContrato, totalAnualContrato } from "@/lib/provisionamento/calculo";
import type { Contrato } from "@/lib/provisionamento/tipos";

const NOMES_MESES = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

// Sem o "R$" — usado só nas 12 colunas de mês do relatório impresso, onde
// cada centímetro de largura conta (12 colunas de valor + Fornecedor +
// Ficha + Total, tudo numa página A4 paisagem só). O cabeçalho e o título
// já deixam claro que os valores são em reais; repetir "R$" em toda
// célula não cabia com fonte legível.
function valorSemPrefixo(valor: number): string {
  return formatarMoeda(valor).replace(/^R\$\s*/, "");
}

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

      {/* provisionamento-relatorio-print: força A4 paisagem só nesse
          window.print() (ver globals.css) — as 15 colunas (Fornecedor +
          Ficha + 12 meses + Total) não cabem em retrato de jeito nenhum.
          O título entra AQUI DENTRO (não antes) pra sair na mesma página
          paisagem — um elemento com "page" só vale a partir de onde a
          quebra de página acontece; posto antes, ficaria sozinho numa
          página retrato em branco. print:table-fixed + as larguras em mm
          no cabeçalho garantem que as colunas cabem juntas numa página
          só, mesmo com fonte maior — sem isso, a coluna Fornecedor (nome
          de empresa pode ser bem longo) cresceria livre e empurraria os
          meses pra fora da página. */}
      <div className="provisionamento-relatorio-print mt-4 overflow-x-auto rounded-lg border border-slate-200 print:overflow-visible print:break-before-page print:border-0 print:p-[6mm]">
        <h2 className="hidden text-lg font-semibold text-brand-navy print:block">
          Provisionamento Orçamentário {ano} — Câmara Municipal de Nepomuceno/MG
        </h2>
        <p className="mb-3 hidden text-[8pt] text-slate-500 print:block">
          Valores mensais em reais (R$) — símbolo omitido nas colunas de mês por espaço.
        </p>
        {/* print:w-fit (+ min-w-0) desfaz o min-w-full/comportamento de
            esticar até o container (herdado de algum ancestor flex/grid
            na árvore do app) — com table-fixed, qualquer coisa que force
            a tabela a ocupar mais que a soma das larguras em mm faz o
            navegador esticar TODAS as colunas proporcionalmente,
            ignorando os valores em mm de cada uma. */}
        <table className="min-w-full table-auto divide-y divide-slate-200 text-xs print:w-fit print:min-w-0 print:table-fixed print:text-[9pt]">
          <thead className="bg-brand-navy/5 print:bg-transparent">
            <tr>
              <th className="sticky left-0 bg-brand-navy/5 px-3 py-2 text-left font-medium text-slate-600 print:static print:w-[30mm] print:bg-transparent print:px-1 print:py-1">
                Fornecedor
              </th>
              <th className="px-2 py-2 text-left font-medium text-slate-600 print:w-[12mm] print:px-1 print:py-1">
                Ficha
              </th>
              {NOMES_MESES.map((m) => (
                <th
                  key={m}
                  className="px-2 py-2 text-right font-medium text-slate-600 print:w-[18mm] print:px-1 print:py-1"
                >
                  {m}
                </th>
              ))}
              <th className="px-2 py-2 text-right font-medium text-slate-600 print:w-[25mm] print:px-1 print:py-1">
                Total {ano} (R$)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contratos.map((c) => {
              const valoresMensais = provisionamentoMensalContrato(c, ano);
              return (
                <tr key={c.id} className="hover:bg-slate-50 print:break-inside-avoid print:hover:bg-transparent">
                  <td
                    className="sticky left-0 bg-white px-3 py-2 text-slate-900 print:static print:truncate print:px-1 print:py-1"
                    title={c.fornecedor}
                  >
                    {c.fornecedor}
                  </td>
                  <td className="px-2 py-2 text-slate-700 print:px-1 print:py-1">
                    {c.ficha ? `Ficha ${c.ficha.ficha}` : "—"}
                  </td>
                  {valoresMensais.map((v, i) => (
                    <td key={i} className="px-2 py-2 text-right text-slate-700 print:px-1 print:py-1">
                      {v > 0 ? valorSemPrefixo(v) : "—"}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-right font-semibold text-slate-900 print:px-1 print:py-1">
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
                <td className="sticky left-0 bg-white px-3 py-2 text-slate-900 print:static print:px-1 print:py-1">
                  Total
                </td>
                <td className="px-2 py-2 print:px-1 print:py-1" />
                {totaisPorMes.map((v, i) => (
                  <td key={i} className="px-2 py-2 text-right text-slate-900 print:px-1 print:py-1">
                    {valorSemPrefixo(v)}
                  </td>
                ))}
                <td className="px-2 py-2 text-right text-slate-900 print:px-1 print:py-1">
                  {formatarMoeda(totalGeral)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
