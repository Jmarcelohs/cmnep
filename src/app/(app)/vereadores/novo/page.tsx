import { redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { criarVereador } from "../actions";
import { VereadorForm } from "../vereador-form";

export default async function NovoVereadorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/vereadores");

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Novo vereador</h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <VereadorForm action={criarVereador} />
    </div>
  );
}
