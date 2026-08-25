"use client";

import { useState } from "react";
import type { DocumentoProcesso } from "@/lib/licitacoes/tipos";
import { salvarCamposTr } from "../actions";

export type CamposTr = {
  trSolucaoEscolhida: string;
  trNaturezaExecucao: "continuada" | "nao_continuada";
  trJustificativaNatureza: string;
};

export function TrFormulario({
  processoId,
  valoresIniciais,
  imprimirHref,
  onSalvar,
  onFechar,
}: {
  processoId: string;
  valoresIniciais: CamposTr;
  imprimirHref: string;
  onSalvar: (documento: DocumentoProcesso, campos: CamposTr) => void;
  onFechar: () => void;
}) {
  const [campos, setCampos] = useState<CamposTr>(valoresIniciais);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const documento = await salvarCamposTr(processoId, campos);
      onSalvar(documento, campos);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-700">Termo de Referência</p>
      <p className="mt-1 text-xs text-slate-500">
        A base jurídica (dispensa por valor, obrigações, sanções...) já vem pronta a partir dos dados do
        processo. Preencha aqui só o que varia por processo — o documento é sempre recalculado a partir
        destes campos.
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Solução escolhida (seção 2.3 a 2.5 — com base no ETP deste processo)
          </label>
          <textarea
            value={campos.trSolucaoEscolhida}
            onChange={(e) => setCampos((c) => ({ ...c, trSolucaoEscolhida: e.target.value }))}
            rows={6}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            placeholder="Descreva a solução escolhida e o resultado esperado..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Natureza da execução (seção 14)</label>
          <div className="mt-1 flex gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="natureza"
                checked={campos.trNaturezaExecucao === "nao_continuada"}
                onChange={() => setCampos((c) => ({ ...c, trNaturezaExecucao: "nao_continuada" }))}
              />
              Não continuada
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="natureza"
                checked={campos.trNaturezaExecucao === "continuada"}
                onChange={() => setCampos((c) => ({ ...c, trNaturezaExecucao: "continuada" }))}
              />
              Continuada
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Justificativa da natureza</label>
          <textarea
            value={campos.trJustificativaNatureza}
            onChange={(e) => setCampos((c) => ({ ...c, trJustificativaNatureza: e.target.value }))}
            rows={4}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      {erro && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
        <a
          href={imprimirHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Ver / imprimir
        </a>
        <button
          type="button"
          onClick={onFechar}
          disabled={salvando}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}
