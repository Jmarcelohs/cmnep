"use client";

import { useState } from "react";
import { baixarArquivo } from "@/lib/provisionamento/csv";
import { exportarJson, importarJson } from "@/lib/provisionamento/armazenamento";
import type { Contrato, NovoContrato } from "@/lib/provisionamento/tipos";

export function ParametrosTab({
  contratos,
  onImportar,
  onApagarTudo,
}: {
  contratos: Contrato[];
  onImportar: (lista: NovoContrato[]) => Promise<void>;
  onApagarTudo: () => Promise<void>;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);

  function exportar() {
    const dataHoje = new Date().toISOString().slice(0, 10);
    baixarArquivo(
      `provisionamento-orcamentario-backup-${dataHoje}.json`,
      exportarJson(contratos),
      "application/json;charset=utf-8",
    );
  }

  async function importar(arquivo: File) {
    setErro(null);
    setSucesso(null);
    try {
      const texto = await arquivo.text();
      const importados = importarJson(texto);
      if (
        contratos.length > 0 &&
        !window.confirm(
          `Isso substitui os ${contratos.length} contrato(s) já cadastrados por ${importados.length} do arquivo, pra todo mundo que usa o sistema. Continuar?`,
        )
      ) {
        return;
      }
      setProcessando(true);
      await onImportar(importados);
      setSucesso(`${importados.length} contrato(s) importado(s) com sucesso.`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível ler o arquivo.");
    } finally {
      setProcessando(false);
    }
  }

  async function limparTudo() {
    if (
      !window.confirm(
        `Isso apaga permanentemente os ${contratos.length} contrato(s) cadastrados, pra todo mundo que usa o sistema. Exporte um backup antes, se quiser manter os dados. Continuar?`,
      )
    ) {
      return;
    }
    setErro(null);
    setSucesso(null);
    setProcessando(true);
    try {
      await onApagarTudo();
      setSucesso("Todos os contratos foram apagados.");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível apagar os contratos.");
    } finally {
      setProcessando(false);
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Os contratos ficam salvos no sistema (Supabase) — visíveis pra todo admin, iguais em
        qualquer navegador/dispositivo. Exportar um backup em JSON continua útil pra guardar uma
        cópia à parte ou levar os dados pra outro ambiente.
      </div>

      {erro && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
      {sucesso && <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{sucesso}</p>}

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-700">Backup</p>
        <p className="mt-1 text-sm text-slate-500">
          Exporta todos os {contratos.length} contrato{contratos.length === 1 ? "" : "s"} cadastrados
          num arquivo JSON.
        </p>
        <button
          type="button"
          onClick={exportar}
          disabled={contratos.length === 0}
          className="mt-3 rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          Exportar backup (JSON)
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-700">Restaurar backup</p>
        <p className="mt-1 text-sm text-slate-500">
          Importa um arquivo JSON exportado por essa mesma ferramenta — substitui os contratos
          cadastrados no sistema pra todo mundo.
        </p>
        <input
          type="file"
          accept="application/json"
          disabled={processando}
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            if (arquivo) importar(arquivo);
            e.target.value = "";
          }}
          className="mt-3 block text-sm text-slate-600 disabled:opacity-50"
        />
      </div>

      <div className="rounded-lg border border-red-200 p-4">
        <p className="text-sm font-semibold text-red-700">Apagar todos os dados</p>
        <p className="mt-1 text-sm text-slate-500">
          Remove todos os contratos cadastrados no sistema. Não afeta backups já exportados.
        </p>
        <button
          type="button"
          onClick={limparTudo}
          disabled={contratos.length === 0 || processando}
          className="mt-3 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Apagar todos os contratos
        </button>
      </div>
    </div>
  );
}
