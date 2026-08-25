"use client";

import { useState } from "react";
import { formatarMoeda } from "@/lib/pdf/formato";
import { salvarItens } from "../actions";
import type { ItemProcesso, NovoItemProcesso } from "@/lib/licitacoes/tipos";

function paraNovo(item: ItemProcesso): NovoItemProcesso {
  return {
    numeroItem: item.numeroItem,
    objeto: item.objeto,
    unidade: item.unidade,
    quantidade: item.quantidade,
    valorUnitario: item.valorUnitario,
    valorGlobal: item.valorGlobal,
  };
}

function linhaVazia(numeroItem: number): NovoItemProcesso {
  return { numeroItem, objeto: "", unidade: "", quantidade: 1, valorUnitario: null, valorGlobal: null };
}

export function ItensEditor({ processoId, itensIniciais }: { processoId: string; itensIniciais: ItemProcesso[] }) {
  const [linhas, setLinhas] = useState<NovoItemProcesso[]>(
    itensIniciais.length > 0 ? itensIniciais.map(paraNovo) : [linhaVazia(1)],
  );
  const [editando, setEditando] = useState(itensIniciais.length === 0);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function atualizarLinha<K extends keyof NovoItemProcesso>(indice: number, campo: K, valor: NovoItemProcesso[K]) {
    setLinhas((atual) => atual.map((l, i) => (i === indice ? { ...l, [campo]: valor } : l)));
  }

  function adicionarLinha() {
    setLinhas((atual) => [...atual, linhaVazia((atual.at(-1)?.numeroItem ?? 0) + 1)]);
  }

  function removerLinha(indice: number) {
    setLinhas((atual) => atual.filter((_, i) => i !== indice));
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const validos = linhas.filter((l) => l.objeto.trim() !== "");
      await salvarItens(processoId, validos);
      setLinhas(validos.length > 0 ? validos : [linhaVazia(1)]);
      setEditando(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar os itens.");
    } finally {
      setSalvando(false);
    }
  }

  if (!editando) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-700">Itens (demanda)</p>
          <button type="button" onClick={() => setEditando(true)} className="text-xs font-medium text-brand-navy hover:underline">
            Editar itens
          </button>
        </div>
        <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-brand-navy/5">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Item</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Objeto</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Unid.</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Quant.</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">V. Unitário</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">V. Global</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {linhas.map((l, i) => (
                <tr key={i}>
                  <td className="px-3 py-2 text-slate-900">{String(l.numeroItem).padStart(3, "0")}</td>
                  <td className="px-3 py-2 text-slate-700">{l.objeto}</td>
                  <td className="px-3 py-2 text-slate-700">{l.unidade}</td>
                  <td className="px-3 py-2 text-slate-700">{l.quantidade}</td>
                  <td className="px-3 py-2 text-slate-700">{l.valorUnitario != null ? formatarMoeda(l.valorUnitario) : "—"}</td>
                  <td className="px-3 py-2 text-slate-700">{l.valorGlobal != null ? formatarMoeda(l.valorGlobal) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">Itens (demanda)</p>
      {erro && <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
      <div className="mt-2 space-y-3">
        {linhas.map((l, i) => (
          <div key={i} className="grid grid-cols-12 gap-2 rounded-lg border border-slate-200 p-3">
            <div className="col-span-12 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-500">Item</label>
              <input
                type="number"
                value={l.numeroItem}
                onChange={(e) => atualizarLinha(i, "numeroItem", Number(e.target.value) || 1)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </div>
            <div className="col-span-12 sm:col-span-5">
              <label className="block text-xs font-medium text-slate-500">Objeto</label>
              <textarea
                value={l.objeto}
                onChange={(e) => atualizarLinha(i, "objeto", e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </div>
            <div className="col-span-4 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-500">Unid.</label>
              <input
                value={l.unidade}
                onChange={(e) => atualizarLinha(i, "unidade", e.target.value)}
                placeholder="SV"
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </div>
            <div className="col-span-4 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-500">Quant.</label>
              <input
                type="number"
                step="0.01"
                value={l.quantidade}
                onChange={(e) => atualizarLinha(i, "quantidade", Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </div>
            <div className="col-span-6 sm:col-span-1">
              <label className="block text-xs font-medium text-slate-500">V. Unitário</label>
              <input
                type="number"
                step="0.01"
                value={l.valorUnitario ?? ""}
                onChange={(e) => atualizarLinha(i, "valorUnitario", e.target.value ? Number(e.target.value) : null)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </div>
            <div className="col-span-6 sm:col-span-2">
              <label className="block text-xs font-medium text-slate-500">V. Global</label>
              <input
                type="number"
                step="0.01"
                value={l.valorGlobal ?? ""}
                onChange={(e) => atualizarLinha(i, "valorGlobal", e.target.value ? Number(e.target.value) : null)}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
              />
            </div>
            <div className="col-span-12 sm:col-span-1 sm:self-end">
              <button
                type="button"
                onClick={() => removerLinha(i)}
                className="mt-1 text-xs font-medium text-red-600 hover:underline"
              >
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={adicionarLinha}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          + Item
        </button>
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Salvar itens"}
        </button>
      </div>
    </div>
  );
}
