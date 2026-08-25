"use client";

import { useEffect, useState } from "react";
import { rotuloFicha } from "@/lib/suplementacoes/documento";
import { MODALIDADES_PROCESSO } from "@/lib/licitacoes/tipos";
import type { DotacaoOrcamentaria } from "@/lib/suplementacoes/documento";
import type { NovoProcesso, PessoaResumo, Processo } from "@/lib/licitacoes/tipos";
import { proximosNumerosSugeridos } from "./actions";

const ANO_PADRAO = new Date().getFullYear();

function camposIniciais(): NovoProcesso {
  return {
    numeroProcesso: 0,
    ano: ANO_PADRAO,
    modalidade: "dispensa",
    numeroModalidade: 0,
    dataAbertura: new Date().toISOString().slice(0, 10),
    objeto: "",
    fichaId: null,
    dotacaoSubelemento: "",
    vinculoPca: "",
    organizadorPessoaId: null,
    agenteContratacaoPessoaId: null,
  };
}

export function ProcessoForm({
  valoresIniciais,
  fichas,
  pessoas,
  onSalvar,
  onCancelar,
  salvando,
}: {
  valoresIniciais: Processo | null;
  fichas: DotacaoOrcamentaria[];
  pessoas: PessoaResumo[];
  onSalvar: (dados: NovoProcesso) => void;
  onCancelar: () => void;
  salvando: boolean;
}) {
  const [campos, setCampos] = useState<NovoProcesso>(valoresIniciais ?? camposIniciais());
  const [sugerindo, setSugerindo] = useState(false);

  function atualizar<K extends keyof NovoProcesso>(campo: K, valor: NovoProcesso[K]) {
    setCampos((c) => ({ ...c, [campo]: valor }));
  }

  // Sugere o próximo número (procedimento geral + dentro da modalidade)
  // só na criação — em edição, mexer no ano/modalidade não deve
  // sobrescrever os números já salvos.
  useEffect(() => {
    if (valoresIniciais) return;
    let cancelado = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- dispara a busca da sugestão, não sincroniza estado externo
    setSugerindo(true);
    proximosNumerosSugeridos(campos.ano, campos.modalidade)
      .then((sugestao) => {
        if (!cancelado) {
          setCampos((c) => ({
            ...c,
            numeroProcesso: sugestao.numeroProcesso,
            numeroModalidade: sugestao.numeroModalidade,
          }));
        }
      })
      .finally(() => !cancelado && setSugerindo(false));
    return () => {
      cancelado = true;
    };
  }, [campos.ano, campos.modalidade, valoresIniciais]);

  function aoSalvar(e: React.FormEvent) {
    e.preventDefault();
    onSalvar(campos);
  }

  return (
    <form onSubmit={aoSalvar} className="space-y-6">
      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-700">Numeração</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nº do procedimento</label>
            <input
              type="number"
              min="1"
              value={campos.numeroProcesso || ""}
              onChange={(e) => atualizar("numeroProcesso", Number(e.target.value) || 0)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Ano</label>
            <input
              type="number"
              value={campos.ano || ""}
              onChange={(e) => atualizar("ano", Number(e.target.value) || ANO_PADRAO)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Modalidade</label>
            <select
              value={campos.modalidade}
              onChange={(e) => atualizar("modalidade", e.target.value as NovoProcesso["modalidade"])}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
            >
              {MODALIDADES_PROCESSO.map((m) => (
                <option key={m.valor} value={m.valor}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Nº da modalidade</label>
            <input
              type="number"
              min="1"
              value={campos.numeroModalidade || ""}
              onChange={(e) => atualizar("numeroModalidade", Number(e.target.value) || 0)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
        {sugerindo && <p className="mt-2 text-xs text-slate-500">Sugerindo próximo número…</p>}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Data de abertura</label>
          <input
            type="date"
            value={campos.dataAbertura}
            onChange={(e) => atualizar("dataAbertura", e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Objeto</label>
        <textarea
          value={campos.objeto}
          onChange={(e) => atualizar("objeto", e.target.value)}
          required
          rows={3}
          placeholder="Ex.: Contratação de pessoa jurídica para..."
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-700">Dotação orçamentária</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Ficha</label>
            <select
              value={campos.fichaId ?? ""}
              onChange={(e) => atualizar("fichaId", e.target.value || null)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
            >
              <option value="">Sem ficha vinculada ainda</option>
              {fichas.map((f) => (
                <option key={f.id} value={f.id}>
                  {rotuloFicha(f)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Subelemento</label>
            <input
              value={campos.dotacaoSubelemento}
              onChange={(e) => atualizar("dotacaoSubelemento", e.target.value)}
              placeholder="Ex.: 48 – Serviços Gráficos"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Vínculo no PCA</label>
        <input
          value={campos.vinculoPca}
          onChange={(e) => atualizar("vinculoPca", e.target.value)}
          placeholder="Ex.: Contratação de serviços gráficos (impressão e correlatos)"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Quem organizou o processo</label>
          <select
            value={campos.organizadorPessoaId ?? ""}
            onChange={(e) => atualizar("organizadorPessoaId", e.target.value || null)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="">Selecione…</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} — {p.cargo}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Agente de contratação</label>
          <select
            value={campos.agenteContratacaoPessoaId ?? ""}
            onChange={(e) => atualizar("agenteContratacaoPessoaId", e.target.value || null)}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="">Selecione…</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} — {p.cargo}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Salvar processo"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={salvando}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
