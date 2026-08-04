"use client";

import type { Papel } from "@/lib/supabase/database.types";

const PAPEIS: { value: Papel; label: string }[] = [
  { value: "servidor", label: "Servidor" },
  { value: "gestor_diarias", label: "Gestor de Diárias" },
  { value: "ordenador_despesa", label: "Ordenador da despesa" },
  { value: "tesoureiro", label: "Tesoureiro" },
  { value: "controle_interno", label: "Controle interno" },
  { value: "admin", label: "Administrador" },
];

export type ValoresIniciaisUsuario = {
  nome: string;
  email: string;
  papel: Papel;
  pessoa_id: string;
};

export function UsuarioForm({
  action,
  pessoas,
  valoresIniciais,
  submitLabel,
  pedirSenha = false,
}: {
  action: (formData: FormData) => void;
  pessoas: { id: string; nome: string }[];
  valoresIniciais?: ValoresIniciaisUsuario;
  submitLabel: string;
  pedirSenha?: boolean;
}) {
  return (
    <form action={action} className="mt-6 max-w-lg space-y-4">
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
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">E-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={valoresIniciais?.email}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {pedirSenha && (
        <div>
          <label htmlFor="senha" className="block text-sm font-medium text-slate-700">Senha provisória</label>
          <input
            id="senha"
            name="senha"
            type="text"
            required
            minLength={6}
            placeholder="mínimo 6 caracteres"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            Passe essa senha pra pessoa por fora do sistema — ela consegue trocar depois de logar.
          </p>
        </div>
      )}
      <div>
        <label htmlFor="papel" className="block text-sm font-medium text-slate-700">Papel</label>
        <select
          id="papel"
          name="papel"
          required
          defaultValue={valoresIniciais?.papel ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Selecione…</option>
          {PAPEIS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="pessoa_id" className="block text-sm font-medium text-slate-700">
          Pessoa vinculada (opcional)
        </label>
        <select
          id="pessoa_id"
          name="pessoa_id"
          defaultValue={valoresIniciais?.pessoa_id ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Nenhuma</option>
          {pessoas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-500">
          Liga esse login ao cadastro de pessoas — é o que faz o sistema reconhecer quais
          diárias, requerimentos etc. são dessa pessoa.
        </p>
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
