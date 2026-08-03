import { redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { criarDecretoTituloHonorario } from "../actions";
import { DecretoForm } from "../decreto-form";

export default async function NovoDecretoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin" && usuario?.papel !== "ordenador_despesa") redirect("/decretos");

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Novo decreto de título de cidadão honorário</h1>
      <p className="mt-1 text-sm text-slate-500">
        O texto dos artigos é padronizado automaticamente — só preencha os dados que variam.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <DecretoForm action={criarDecretoTituloHonorario} />
    </div>
  );
}
