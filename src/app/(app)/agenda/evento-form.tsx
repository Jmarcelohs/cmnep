"use client";

import { useState } from "react";

export type ValoresIniciaisEvento = {
  titulo: string;
  descricao: string;
  local: string;
  diaTodo: boolean;
  inicio: string;
  fim: string;
};

export function EventoForm({
  action,
  valoresIniciais,
  submitLabel = "Salvar compromisso",
}: {
  action: (formData: FormData) => void;
  valoresIniciais?: ValoresIniciaisEvento;
  submitLabel?: string;
}) {
  const [titulo, setTitulo] = useState(valoresIniciais?.titulo ?? "");
  const [descricao, setDescricao] = useState(valoresIniciais?.descricao ?? "");
  const [local, setLocal] = useState(valoresIniciais?.local ?? "");
  const [diaTodo, setDiaTodo] = useState(valoresIniciais?.diaTodo ?? false);
  const [inicio, setInicio] = useState(valoresIniciais?.inicio ?? "");
  const [fim, setFim] = useState(valoresIniciais?.fim ?? "");

  return (
    <form action={action} className="mt-6 space-y-4">
      <div>
        <label htmlFor="titulo" className="block text-sm font-medium text-slate-700">
          Título
        </label>
        <input
          id="titulo"
          name="titulo"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          required
          placeholder="Ex.: Sessão Ordinária, Reunião com a Prefeitura..."
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="dia_todo"
          type="checkbox"
          name="dia_todo"
          value="1"
          checked={diaTodo}
          onChange={(e) => setDiaTodo(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        <label htmlFor="dia_todo" className="text-sm text-slate-700">
          Dia inteiro (sem horário)
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="inicio" className="block text-sm font-medium text-slate-700">
            {diaTodo ? "Data de início" : "Início"}
          </label>
          <input
            id="inicio"
            name="inicio"
            type={diaTodo ? "date" : "datetime-local"}
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="fim" className="block text-sm font-medium text-slate-700">
            {diaTodo ? "Data de término" : "Término"}
          </label>
          <input
            id="fim"
            name="fim"
            type={diaTodo ? "date" : "datetime-local"}
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="local" className="block text-sm font-medium text-slate-700">
          Local (opcional)
        </label>
        <input
          id="local"
          name="local"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          placeholder="Ex.: Plenário da Câmara"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="descricao" className="block text-sm font-medium text-slate-700">
          Descrição (opcional)
        </label>
        <textarea
          id="descricao"
          name="descricao"
          rows={4}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
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
