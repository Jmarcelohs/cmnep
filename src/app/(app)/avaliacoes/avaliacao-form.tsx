"use client";

import { useMemo, useState } from "react";
import { calcularResumo, totalItensTemplate } from "@/lib/avaliacoes/calculo";
import type { AvaliacaoTemplate } from "@/lib/avaliacoes/templates";
import type { AvaliadorLancado, Categoria, ConceitoAvaliacao, ItemAvaliacaoLancado, PeriodoAvaliacao } from "@/lib/supabase/database.types";

type Pessoa = { id: string; nome: string; matricula: string | null; categoria: Categoria };
type AvaliadorCadastro = { id: string; nome: string; matricula: string | null };

const PERIODOS: { value: PeriodoAvaliacao; label: string }[] = [
  { value: "trimestre_1", label: "1º Trimestre" },
  { value: "trimestre_2", label: "2º Trimestre" },
  { value: "trimestre_3", label: "3º Trimestre" },
  { value: "anual", label: "Final" },
];

export type ValoresIniciaisAvaliacao = {
  pessoa_id: string;
  ano: string;
  periodo: PeriodoAvaliacao;
  data_avaliacao: string;
  em_estagio_probatorio: boolean;
  avaliadores: AvaliadorLancado[];
  itens: ItemAvaliacaoLancado[];
  pontos_melhorar: string;
  pontos_positivos: string;
};

function chaveItem(criterio: string, numero: number) {
  return `${criterio}-${numero}`;
}

export function AvaliacaoForm({
  action,
  template,
  pessoas,
  avaliadoresCadastro,
  valoresIniciais,
  submitLabel = "Salvar avaliação",
}: {
  action: (formData: FormData) => void;
  template: AvaliacaoTemplate;
  pessoas: Pessoa[];
  avaliadoresCadastro: AvaliadorCadastro[];
  valoresIniciais?: ValoresIniciaisAvaliacao;
  submitLabel?: string;
}) {
  const [pessoaId, setPessoaId] = useState(valoresIniciais?.pessoa_id ?? "");
  const [ano, setAno] = useState(valoresIniciais?.ano ?? String(new Date().getFullYear()));
  const [periodo, setPeriodo] = useState<PeriodoAvaliacao>(valoresIniciais?.periodo ?? "trimestre_1");
  const [dataAvaliacao, setDataAvaliacao] = useState(
    valoresIniciais?.data_avaliacao ?? new Date().toISOString().slice(0, 10),
  );
  const [emEstagioProbatorio, setEmEstagioProbatorio] = useState(
    valoresIniciais?.em_estagio_probatorio ?? true,
  );

  const nomesIniciaisSelecionados = useMemo(
    () => new Set((valoresIniciais?.avaliadores ?? []).map((a) => a.nome.trim().toLowerCase())),
    [valoresIniciais],
  );
  const [avaliadoresSelecionados, setAvaliadoresSelecionados] = useState<Set<string>>(
    () =>
      new Set(
        avaliadoresCadastro.filter((a) => nomesIniciaisSelecionados.has(a.nome.trim().toLowerCase())).map((a) => a.id),
      ),
  );

  const [itens, setItens] = useState<Record<string, ConceitoAvaliacao>>(() => {
    const inicial: Record<string, ConceitoAvaliacao> = {};
    for (const item of valoresIniciais?.itens ?? []) {
      inicial[chaveItem(item.criterio, item.numero)] = item.conceito;
    }
    return inicial;
  });

  const [pontosMelhorar, setPontosMelhorar] = useState(valoresIniciais?.pontos_melhorar ?? "");
  const [pontosPositivos, setPontosPositivos] = useState(valoresIniciais?.pontos_positivos ?? "");

  function alternarAvaliador(id: string) {
    setAvaliadoresSelecionados((prev) => {
      const proximo = new Set(prev);
      if (proximo.has(id)) proximo.delete(id);
      else proximo.add(id);
      return proximo;
    });
  }

  function marcarItem(criterio: string, numero: number, conceito: ConceitoAvaliacao) {
    setItens((prev) => ({ ...prev, [chaveItem(criterio, numero)]: conceito }));
  }

  const itensLancados: ItemAvaliacaoLancado[] = useMemo(
    () =>
      Object.entries(itens).map(([chave, conceito]) => {
        const [criterio, numeroTexto] = chave.split("-");
        return { criterio, numero: Number(numeroTexto), conceito };
      }),
    [itens],
  );

  const totalItens = totalItensTemplate(template);
  const itensRespondidos = itensLancados.length;

  const resumo = useMemo(() => calcularResumo(itensLancados, template), [itensLancados, template]);

  const avaliadoresJson: AvaliadorLancado[] = useMemo(
    () =>
      avaliadoresCadastro
        .filter((a) => avaliadoresSelecionados.has(a.id))
        .map((a) => ({ nome: a.nome, matricula: a.matricula })),
    [avaliadoresCadastro, avaliadoresSelecionados],
  );

  return (
    <form action={action} className="mt-6 space-y-8">
      <input type="hidden" name="pessoa_id" value={pessoaId} />
      <input type="hidden" name="ano" value={ano} />
      <input type="hidden" name="periodo" value={periodo} />
      <input type="hidden" name="data_avaliacao" value={dataAvaliacao} />
      <input type="hidden" name="em_estagio_probatorio" value={emEstagioProbatorio ? "true" : "false"} />
      <input type="hidden" name="avaliadores" value={JSON.stringify(avaliadoresJson)} />
      <input type="hidden" name="itens" value={JSON.stringify(itensLancados)} />
      <input type="hidden" name="pontos_melhorar" value={pontosMelhorar} />
      <input type="hidden" name="pontos_positivos" value={pontosPositivos} />

      <div>
        <h2 className="text-sm font-semibold text-slate-700">1. Identificação</h2>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Servidor(a)</label>
            <select
              required
              value={pessoaId}
              onChange={(e) => setPessoaId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione…</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} {p.matricula ? `(mat. ${p.matricula})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Ano</label>
            <input
              type="number"
              required
              value={ano}
              onChange={(e) => setAno(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Período</label>
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as PeriodoAvaliacao)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {PERIODOS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Data da avaliação</label>
            <input
              type="date"
              required
              value={dataAvaliacao}
              onChange={(e) => setDataAvaliacao(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Servidor(a) em estágio probatório?</label>
            <div className="mt-2 flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setEmEstagioProbatorio(true)}
                className={`rounded-full px-3 py-1 ${emEstagioProbatorio ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-600"}`}
              >
                Sim
              </button>
              <button
                type="button"
                onClick={() => setEmEstagioProbatorio(false)}
                className={`rounded-full px-3 py-1 ${!emEstagioProbatorio ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-600"}`}
              >
                Não
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Define o título do documento gerado ({emEstagioProbatorio ? "…em Estágio Probatório" : "Avaliação de Desempenho"}).
            </p>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700">2. Avaliadores responsáveis</h2>
        {avaliadoresCadastro.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">
            Nenhum avaliador cadastrado ainda — cadastre em &quot;Avaliadores&quot; antes de lançar a avaliação.
          </p>
        ) : (
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {avaliadoresCadastro.map((a) => (
              <label
                key={a.id}
                className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={avaliadoresSelecionados.has(a.id)}
                  onChange={() => alternarAvaliador(a.id)}
                />
                {a.nome} {a.matricula ? `(mat. ${a.matricula})` : ""}
              </label>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">3. Critérios de avaliação</h2>
          <p className={`text-xs ${itensRespondidos === totalItens ? "text-emerald-600" : "text-amber-600"}`}>
            {itensRespondidos} de {totalItens} itens avaliados
          </p>
        </div>

        <div className="mt-3 space-y-6">
          {template.criterios.map((criterio) => (
            <div key={criterio.key} className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {criterio.key} — {criterio.nome}
              </p>
              <p className="mt-1 text-xs text-slate-500">{criterio.definicao}</p>
              {criterio.escala && <p className="mt-1 text-xs italic text-slate-400">{criterio.escala}</p>}

              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="w-1/2 px-2 py-1 text-left font-medium text-slate-500">Item</th>
                      {template.conceitos.map((c) => (
                        <th key={c.key} className="px-2 py-1 text-center font-medium text-slate-500">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {criterio.itens.map((item) => (
                      <tr key={item.numero}>
                        <td className="px-2 py-2 text-slate-700">{item.numero}. {item.texto}</td>
                        {template.conceitos.map((c) => (
                          <td key={c.key} className="px-2 py-2 text-center">
                            <input
                              type="radio"
                              required
                              name={`radio-${chaveItem(criterio.key, item.numero)}`}
                              checked={itens[chaveItem(criterio.key, item.numero)] === c.key}
                              onChange={() => marcarItem(criterio.key, item.numero, c.key)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700">4. Observações</h2>
        <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Pontos a serem melhorados</label>
            <textarea
              rows={4}
              value={pontosMelhorar}
              onChange={(e) => setPontosMelhorar(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Pontos positivos</label>
            <textarea
              rows={4}
              value={pontosPositivos}
              onChange={(e) => setPontosPositivos(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Resumo (calculado ao vivo)</p>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="px-2 py-1 text-left font-medium text-slate-500">Critério</th>
                {template.conceitos.map((c) => (
                  <th key={c.key} className="px-2 py-1 text-center font-medium text-slate-500">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {template.criterios.map((criterio) => (
                <tr key={criterio.key}>
                  <td className="px-2 py-1 text-slate-700">{criterio.key} - {criterio.nome}</td>
                  {template.conceitos.map((c) => (
                    <td key={c.key} className="px-2 py-1 text-center text-slate-700">
                      {resumo.porCriterio[criterio.key]?.[c.key] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="px-2 py-1 text-slate-900">Total dos Conceitos</td>
                {template.conceitos.map((c) => (
                  <td key={c.key} className="px-2 py-1 text-center text-slate-900">
                    {resumo.totalPorConceito[c.key]}
                  </td>
                ))}
              </tr>
              <tr className="text-slate-500">
                <td className="px-2 py-1">Pontos (contagem × peso)</td>
                {template.conceitos.map((c) => (
                  <td key={c.key} className="px-2 py-1 text-center">
                    {resumo.pontosPorConceito[c.key]}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-lg font-semibold text-brand-navy">Nota final: {resumo.notaFinal.toFixed(2)} / 100</p>
      </div>

      <button
        type="submit"
        className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
      >
        {submitLabel}
      </button>
    </form>
  );
}
