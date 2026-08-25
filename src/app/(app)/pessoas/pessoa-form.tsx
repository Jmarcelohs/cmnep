"use client";

import { useState } from "react";
import { formatarCpfDigitado } from "@/lib/reembolso/mascaras";

export type ValoresIniciaisPessoa = {
  matricula: string;
  nome: string;
  cargo: string;
  categoria: string;
  partido: string;
  cpf: string;
  genero: string;
};

export function PessoaForm({
  action,
  valoresIniciais,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  valoresIniciais?: ValoresIniciaisPessoa;
  submitLabel: string;
}) {
  const [cpf, setCpf] = useState(formatarCpfDigitado(valoresIniciais?.cpf ?? ""));
  const [categoria, setCategoria] = useState(valoresIniciais?.categoria ?? "");

  return (
    <form action={action} className="mt-6 max-w-lg space-y-4">
      <div>
        <label htmlFor="matricula" className="block text-sm font-medium text-slate-700">Matrícula</label>
        <input
          id="matricula"
          name="matricula"
          defaultValue={valoresIniciais?.matricula}
          placeholder="ex.: 1106 (deixe em branco se não houver)"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="cpf" className="block text-sm font-medium text-slate-700">CPF</label>
        <input
          id="cpf"
          name="cpf"
          value={cpf}
          onChange={(e) => setCpf(formatarCpfDigitado(e.target.value))}
          placeholder="000.000.000-00"
          inputMode="numeric"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-slate-500">
          Dado sensível (LGPD): visível só para admin/ordenador da despesa e para a própria
          pessoa. Usado nos requerimentos de reembolso.
        </p>
      </div>
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-slate-700">Nome</label>
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
          placeholder="ex.: Diretor Executivo — Função Comissionada"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="categoria" className="block text-sm font-medium text-slate-700">Categoria</label>
        <select
          id="categoria"
          name="categoria"
          required
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Selecione…</option>
          <option value="Efetivo">Efetivo</option>
          <option value="Comissionado">Comissionado</option>
          <option value="Vereador">Vereador</option>
          <option value="Estagiário">Estagiário</option>
        </select>
      </div>
      <div>
        <label htmlFor="genero" className="block text-sm font-medium text-slate-700">Gênero</label>
        <select
          id="genero"
          name="genero"
          defaultValue={valoresIniciais?.genero ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Não informado</option>
          <option value="F">Feminino</option>
          <option value="M">Masculino</option>
        </select>
        <p className="mt-1 text-xs text-slate-500">
          Usado só pra concordância de gênero em textos gerados automaticamente (ex.: Licitações).
        </p>
      </div>
      {categoria === "Vereador" && (
        <div>
          <label htmlFor="partido" className="block text-sm font-medium text-slate-700">Partido</label>
          <input
            id="partido"
            name="partido"
            defaultValue={valoresIniciais?.partido}
            placeholder="ex.: PL – Partido Liberal"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      )}
      <button
        type="submit"
        className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
      >
        {submitLabel}
      </button>
    </form>
  );
}
