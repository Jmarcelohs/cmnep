"use client";

import type { TratamentoOficio } from "@/lib/supabase/database.types";

export type ValoresIniciaisAutoridade = {
  tratamento: TratamentoOficio;
  nome: string;
  cargo: string;
  cidade_uf: string;
};

export function AutoridadeForm({
  action,
  valoresIniciais,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  valoresIniciais?: ValoresIniciaisAutoridade;
  submitLabel: string;
}) {
  return (
    <form action={action} className="mt-6 max-w-lg space-y-4">
      <div>
        <label htmlFor="tratamento" className="block text-sm font-medium text-slate-700">Tratamento</label>
        <select
          id="tratamento"
          name="tratamento"
          defaultValue={valoresIniciais?.tratamento ?? "Excelentíssimo Senhor"}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="Excelentíssimo Senhor">Excelentíssimo Senhor</option>
          <option value="Excelentíssima Senhora">Excelentíssima Senhora</option>
          <option value="Ilustríssimo Senhor">Ilustríssimo Senhor</option>
          <option value="Ilustríssima Senhora">Ilustríssima Senhora</option>
        </select>
      </div>
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-slate-700">Nome completo</label>
        <input
          id="nome"
          name="nome"
          required
          defaultValue={valoresIniciais?.nome}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="cargo" className="block text-sm font-medium text-slate-700">Cargo</label>
        <input
          id="cargo"
          name="cargo"
          required
          defaultValue={valoresIniciais?.cargo}
          placeholder="ex.: Secretário Municipal de Saúde"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="cidade_uf" className="block text-sm font-medium text-slate-700">
          Cidade/UF (opcional)
        </label>
        <input
          id="cidade_uf"
          name="cidade_uf"
          defaultValue={valoresIniciais?.cidade_uf}
          placeholder="ex.: Nepomuceno/MG"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
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
