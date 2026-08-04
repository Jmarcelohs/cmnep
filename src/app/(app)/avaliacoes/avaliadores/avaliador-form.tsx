"use client";

export type ValoresIniciaisAvaliador = {
  nome: string;
  matricula: string;
};

export function AvaliadorForm({
  action,
  valoresIniciais,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  valoresIniciais?: ValoresIniciaisAvaliador;
  submitLabel: string;
}) {
  return (
    <form action={action} className="mt-6 max-w-lg space-y-4">
      <div>
        <label htmlFor="avaliador-nome" className="block text-sm font-medium text-slate-700">Nome</label>
        <input
          id="avaliador-nome"
          name="nome"
          required
          defaultValue={valoresIniciais?.nome}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label htmlFor="avaliador-matricula" className="block text-sm font-medium text-slate-700">Matrícula</label>
        <input
          id="avaliador-matricula"
          name="matricula"
          defaultValue={valoresIniciais?.matricula}
          placeholder="deixe em branco se não houver"
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
