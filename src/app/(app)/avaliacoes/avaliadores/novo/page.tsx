import { redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { criarAvaliador } from "../../actions";
import { AvaliadorForm } from "../avaliador-form";

export default async function NovoAvaliadorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMsg } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/avaliacoes");

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Novo avaliador</h1>

      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <AvaliadorForm action={criarAvaliador} submitLabel="Cadastrar avaliador" />
    </div>
  );
}
