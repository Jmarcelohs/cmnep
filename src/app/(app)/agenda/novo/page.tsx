import { redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { criarEvento } from "../actions";
import { EventoForm } from "../evento-form";

export default async function NovoEventoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (!usuario) redirect("/login");

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Novo compromisso</h1>
      <p className="mt-1 text-sm text-slate-500">
        Entra direto na agenda da Câmara — visível pra qualquer usuário do sistema.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <EventoForm action={criarEvento} />
    </div>
  );
}
