import { redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { criarAutoridade } from "../actions";
import { AutoridadeForm } from "../autoridade-form";

export default async function NovaAutoridadePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMsg } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/autoridades");

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Nova autoridade</h1>
      <p className="mt-1 text-sm text-slate-500">
        Fica disponível no preenchimento rápido do destinatário ao criar um ofício.
      </p>

      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <AutoridadeForm action={criarAutoridade} submitLabel="Cadastrar autoridade" />
    </div>
  );
}
