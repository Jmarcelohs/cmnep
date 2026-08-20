"use client";

import { useRef, useState } from "react";
import { baixarArquivo } from "@/lib/provisionamento/csv";
import { exportarJson, importarJson } from "@/lib/provisionamento/armazenamento";
import type { Contrato } from "@/lib/provisionamento/tipos";

export function ParametrosTab({
  contratos,
  onImportar,
}: {
  contratos: Contrato[];
  onImportar: (contratos: Contrato[]) => void;
}) {
  const inputArquivoRef = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

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
          `Isso substitui os ${contratos.length} contrato(s) já cadastrados neste navegador por ${importados.length} do arquivo. Continuar?`,
        )
      ) {
        return;
      }
      onImportar(importados);
      setSucesso(`${importados.length} contrato(s) importado(s) com sucesso.`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível ler o arquivo.");
    }
  }

  function limparTudo() {
    if (
      !window.confirm(
        `Isso apaga permanentemente os ${contratos.length} contrato(s) cadastrados neste navegador. Exporte um backup antes, se quiser manter os dados. Continuar?`,
      )
    ) {
      return;
    }
    onImportar([]);
    setSucesso("Todos os contratos foram apagados.");
  }

  return (
    <div className="max-w-xl space-y-6">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Os dados desta ferramenta ficam salvos só neste navegador (localStorage) — não são enviados
        pro servidor nem sincronizam entre dispositivos. Trocar de navegador, limpar o cache ou usar
        outro computador significa começar do zero, a menos que você tenha um backup. Exporte um JSON
        com regularidade.
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
          cadastrados neste navegador.
        </p>
        <input
          ref={inputArquivoRef}
          type="file"
          accept="application/json"
          onChange={(e) => {
            const arquivo = e.target.files?.[0];
            if (arquivo) importar(arquivo);
            e.target.value = "";
          }}
          className="mt-3 block text-sm text-slate-600"
        />
      </div>

      <div className="rounded-lg border border-red-200 p-4">
        <p className="text-sm font-semibold text-red-700">Apagar todos os dados</p>
        <p className="mt-1 text-sm text-slate-500">
          Remove todos os contratos cadastrados neste navegador. Não afeta backups já exportados.
        </p>
        <button
          type="button"
          onClick={limparTudo}
          disabled={contratos.length === 0}
          className="mt-3 rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Apagar todos os contratos
        </button>
      </div>
    </div>
  );
}
