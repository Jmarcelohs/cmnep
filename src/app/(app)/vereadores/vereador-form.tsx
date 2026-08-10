"use client";

import { useState } from "react";

export type ValoresIniciaisVereador = {
  nome: string;
  partido: string;
  presidente: boolean;
};

export function VereadorForm({
  action,
  valoresIniciais,
  submitLabel = "Salvar vereador",
}: {
  action: (formData: FormData) => void;
  valoresIniciais?: ValoresIniciaisVereador;
  submitLabel?: string;
}) {
  const [nome, setNome] = useState(valoresIniciais?.nome ?? "");
  const [partido, setPartido] = useState(valoresIniciais?.partido ?? "");
  const [presidente, setPresidente] = useState(valoresIniciais?.presidente ?? false);

  return (
    <form action={action} className="mt-6 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-slate-700">Nome</label>
          <input
            id="nome"
            name="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="partido" className="block text-sm font-medium text-slate-700">Partido (opcional)</label>
          <input
            id="partido"
            name="partido"
            value={partido}
            onChange={(e) => setPartido(e.target.value)}
            placeholder="Ex.: PL"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          name="presidente"
          checked={presidente}
          onChange={(e) => setPresidente(e.target.checked)}
          className="rounded border-slate-300"
        />
        É o(a) Presidente atual da Câmara
      </label>
      <p className="-mt-4 text-xs text-slate-500">
        Marcando esta opção, o vereador atualmente marcado como Presidente é desmarcado — só um por
        vez. Decide se a legenda da assinatura na moção mostra &quot;Presidente&quot; em vez de
        &quot;Vereador(a)&quot;.
      </p>

      <button
        type="submit"
        className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
      >
        {submitLabel}
      </button>
    </form>
  );
}
