"use client";

import { useState } from "react";
import { formatarMoeda } from "@/lib/pdf/formato";
import { baixarArquivo, montarCsv } from "@/lib/provisionamento/csv";
import type { DotacaoOrcamentaria, LoaClassificacao, LoaProjecao, NovaLoaLinha } from "@/lib/provisionamento/tipos";

function rotuloLinha(l: LoaClassificacao): string {
  return `${l.elementoNome} — ${l.projetoAtividadeNome}`;
}

// Código orçamentário completo (órgão.unidade.subfunção.programa.projeto-
// atividade.elemento.fonte, código acumulado a cada nível) — mesma lógica
// de segmentosFicha em src/lib/suplementacoes/documento.ts (já usada nos
// Atos/Decretos reais), só que sobre os campos em camelCase de
// LoaClassificacao em vez do formato de linha do banco.
function codigoCompletoLinha(l: LoaClassificacao): string {
  const unidade = `${l.orgaoCodigo}.${l.unidadeCodigo}`;
  const subfuncao = `${unidade}.${l.subfuncaoCodigo}`;
  const programa = `${subfuncao}.${l.programaCodigo}`;
  const projetoAtividade = `${programa}.${l.projetoAtividadeCodigo}`;
  const elemento = `${projetoAtividade}.${l.elementoCodigo}`;
  return `${elemento}.${l.fonteCodigo}`;
}

// Base pra pré-popular uma linha nova — as 4 primeiras camadas de
// classificação (órgão/unidade/subfunção/programa) são "praticamente
// fixas" pra essa Câmara (só um órgão, uma unidade — ver comentário
// original da migration 0046), então usar a primeira ficha cadastrada
// como sugestão de preenchimento é uma conveniência segura; o usuário
// ainda pode mudar qualquer campo antes de confirmar.
function classificacaoSugerida(fichas: DotacaoOrcamentaria[]): Omit<LoaClassificacao, "projetoAtividadeCodigo" | "projetoAtividadeNome" | "elementoCodigo" | "elementoNome" | "fonteCodigo" | "fonteNome"> {
  const base = fichas[0];
  if (!base) {
    return {
      orgaoCodigo: "",
      orgaoNome: "",
      unidadeCodigo: "",
      unidadeNome: "",
      subfuncaoCodigo: "",
      subfuncaoNome: "",
      programaCodigo: "",
      programaNome: "",
    };
  }
  return {
    orgaoCodigo: base.orgao_codigo,
    orgaoNome: base.orgao_nome,
    unidadeCodigo: base.unidade_codigo,
    unidadeNome: base.unidade_nome,
    subfuncaoCodigo: base.subfuncao_codigo,
    subfuncaoNome: base.subfuncao_nome,
    programaCodigo: base.programa_codigo,
    programaNome: base.programa_nome,
  };
}

function linhasDeFichas2026(fichas: DotacaoOrcamentaria[]): NovaLoaLinha[] {
  return fichas.map((f) => ({
    dotacaoOrigemId: f.id,
    orgaoCodigo: f.orgao_codigo,
    orgaoNome: f.orgao_nome,
    unidadeCodigo: f.unidade_codigo,
    unidadeNome: f.unidade_nome,
    subfuncaoCodigo: f.subfuncao_codigo,
    subfuncaoNome: f.subfuncao_nome,
    programaCodigo: f.programa_codigo,
    programaNome: f.programa_nome,
    projetoAtividadeCodigo: f.projeto_atividade_codigo,
    projetoAtividadeNome: f.projeto_atividade_nome,
    elementoCodigo: f.elemento_codigo,
    elementoNome: f.elemento_nome,
    fonteCodigo: f.fonte_codigo,
    fonteNome: f.fonte_nome,
    // Base de 2026 pra projetar 2027: dotação inicial + suplementado (o
    // valor atualizado de verdade da ficha esse ano) — não o saldo
    // restante, que reflete só o que ainda não foi empenhado.
    valorProjetado: (f.dotacao_inicial_referencia ?? 0) + (f.suplementado_referencia ?? 0),
  }));
}

function totalFichas2026(fichas: DotacaoOrcamentaria[]): number {
  return fichas.reduce((soma, f) => soma + (f.dotacao_inicial_referencia ?? 0) + (f.suplementado_referencia ?? 0), 0);
}

const CAMPOS_CLASSIFICACAO: { campo: keyof LoaClassificacao; label: string }[] = [
  { campo: "orgaoCodigo", label: "Código do Órgão" },
  { campo: "orgaoNome", label: "Órgão" },
  { campo: "unidadeCodigo", label: "Código da Unidade" },
  { campo: "unidadeNome", label: "Unidade" },
  { campo: "subfuncaoCodigo", label: "Código da Subfunção" },
  { campo: "subfuncaoNome", label: "Subfunção" },
  { campo: "programaCodigo", label: "Código do Programa" },
  { campo: "programaNome", label: "Programa" },
  { campo: "projetoAtividadeCodigo", label: "Código do Projeto/Atividade" },
  { campo: "projetoAtividadeNome", label: "Projeto/Atividade" },
  { campo: "elementoCodigo", label: "Código do Elemento de Despesa" },
  { campo: "elementoNome", label: "Elemento de Despesa" },
  { campo: "fonteCodigo", label: "Código da Fonte de Recurso" },
  { campo: "fonteNome", label: "Fonte de Recurso" },
];

function NovaDotacaoForm({
  fichas,
  onIncluir,
  onCancelar,
}: {
  fichas: DotacaoOrcamentaria[];
  onIncluir: (linha: NovaLoaLinha) => void;
  onCancelar: () => void;
}) {
  const [campos, setCampos] = useState<LoaClassificacao>({
    ...classificacaoSugerida(fichas),
    projetoAtividadeCodigo: "",
    projetoAtividadeNome: "",
    elementoCodigo: "",
    elementoNome: "",
    fonteCodigo: "",
    fonteNome: "",
  });
  const [valor, setValor] = useState(0);

  function atualizar<K extends keyof LoaClassificacao>(campo: K, valor: string) {
    setCampos((c) => ({ ...c, [campo]: valor }));
  }

  function aoSubmeter(e: React.FormEvent) {
    e.preventDefault();
    onIncluir({ ...campos, dotacaoOrigemId: null, valorProjetado: valor });
  }

  return (
    <form onSubmit={aoSubmeter} className="mt-4 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-700">Incluir dotação</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CAMPOS_CLASSIFICACAO.map(({ campo, label }) => (
          <div key={campo}>
            <label className="block text-xs font-medium text-slate-500">{label}</label>
            <input
              value={campos[campo]}
              onChange={(e) => atualizar(campo, e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
        ))}
        <div>
          <label className="block text-xs font-medium text-slate-500">Valor projetado (R$)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={valor}
            onChange={(e) => setValor(Number(e.target.value) || 0)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
        >
          Adicionar à proposta
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function LoaTab({
  linhasIniciais,
  fichas,
  onSalvar,
}: {
  linhasIniciais: LoaProjecao[];
  fichas: DotacaoOrcamentaria[];
  onSalvar: (linhas: NovaLoaLinha[]) => Promise<LoaProjecao[] | null>;
}) {
  const [linhas, setLinhas] = useState<NovaLoaLinha[]>(
    linhasIniciais.length > 0 ? linhasIniciais : linhasDeFichas2026(fichas),
  );
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [salvoComSucesso, setSalvoComSucesso] = useState(false);

  const total2027 = linhas.reduce((soma, l) => soma + l.valorProjetado, 0);
  const total2026 = totalFichas2026(fichas);

  function atualizarValor(indice: number, valor: number) {
    setSalvoComSucesso(false);
    setLinhas((atual) => atual.map((l, i) => (i === indice ? { ...l, valorProjetado: valor } : l)));
  }

  function removerLinha(indice: number) {
    setSalvoComSucesso(false);
    setLinhas((atual) => atual.filter((_, i) => i !== indice));
  }

  function incluirDotacao(linha: NovaLoaLinha) {
    setSalvoComSucesso(false);
    setLinhas((atual) => [...atual, linha]);
    setMostrarFormulario(false);
  }

  function exportarCsv() {
    const cabecalho = [
      "Código Orçamentário Completo",
      "Cód. Órgão", "Órgão",
      "Cód. Unidade", "Unidade",
      "Cód. Subfunção", "Subfunção",
      "Cód. Programa", "Programa",
      "Cód. Projeto/Atividade", "Projeto/Atividade",
      "Cód. Elemento de Despesa", "Elemento de Despesa",
      "Cód. Fonte de Recurso", "Fonte de Recurso",
      "Valor Projetado 2027",
    ];
    const dados = linhas.map((l) => [
      codigoCompletoLinha(l),
      l.orgaoCodigo, l.orgaoNome,
      l.unidadeCodigo, l.unidadeNome,
      l.subfuncaoCodigo, l.subfuncaoNome,
      l.programaCodigo, l.programaNome,
      l.projetoAtividadeCodigo, l.projetoAtividadeNome,
      l.elementoCodigo, l.elementoNome,
      l.fonteCodigo, l.fonteNome,
      l.valorProjetado.toFixed(2),
    ]);
    baixarArquivo("proposta-loa-2027.csv", montarCsv(cabecalho, dados), "text/csv;charset=utf-8");
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    setSalvoComSucesso(false);
    try {
      const resultado = await onSalvar(linhas);
      if (resultado) setSalvoComSucesso(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar a proposta.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <p className="text-sm text-slate-600">
        Proposta de orçamento pra LOA 2027, partindo das dotações de 2026 — edite o valor projetado de
        cada linha ou inclua dotações novas. Ferramenta de planejamento interno, sem nenhum efeito
        automático no orçamento oficial quando 2027 começar.
      </p>

      {erro && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
      {salvoComSucesso && (
        <p className="mt-3 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">Proposta salva.</p>
      )}

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Dotação</th>
              <th className="px-4 py-2 text-right font-medium text-slate-600">Valor projetado 2027</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {linhas.map((l, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <p className="font-mono text-xs text-slate-500">{codigoCompletoLinha(l)}</p>
                  <p className="font-medium text-slate-900">{rotuloLinha(l)}</p>
                  <p className="text-xs text-slate-500">{l.fonteNome}</p>
                </td>
                <td className="px-4 py-2 text-right">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={l.valorProjetado}
                    onChange={(e) => atualizarValor(i, Number(e.target.value) || 0)}
                    className="w-32 rounded-md border border-slate-300 px-2 py-1 text-right text-sm"
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => removerLinha(i)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Remover
                  </button>
                </td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma dotação na proposta.
                </td>
              </tr>
            )}
          </tbody>
          {linhas.length > 0 && (
            <tfoot className="border-t-2 border-slate-300 font-semibold">
              <tr>
                <td className="px-4 py-2 text-slate-900">
                  Total proposto 2027
                  <span className="ml-2 font-normal text-slate-500">(2026: {formatarMoeda(total2026)})</span>
                </td>
                <td className="px-4 py-2 text-right text-slate-900">{formatarMoeda(total2027)}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {mostrarFormulario ? (
        <NovaDotacaoForm fichas={fichas} onIncluir={incluirDotacao} onCancelar={() => setMostrarFormulario(false)} />
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMostrarFormulario(true)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            + Incluir dotação
          </button>
          <button
            type="button"
            onClick={exportarCsv}
            disabled={linhas.length === 0}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light disabled:opacity-50"
          >
            {salvando ? "Salvando…" : "Salvar proposta"}
          </button>
        </div>
      )}
    </div>
  );
}
