import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { editarAvaliador } from "../../../actions";
import { AvaliadorForm } from "../../avaliador-form";

export default async function EditarAvaliadorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorMsg } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/avaliacoes");

  const supabase = await createClient();
  const { data: avaliador } = await supabase
    .from("avaliacoes_avaliadores")
    .select("id, nome, matricula")
    .eq("id", id)
    .single();

  if (!avaliador) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Editar avaliador</h1>
      <p className="mt-1 text-sm text-slate-500">{avaliador.nome}</p>

      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <AvaliadorForm
        action={editarAvaliador.bind(null, id)}
        submitLabel="Salvar alterações"
        valoresIniciais={{
          nome: avaliador.nome,
          matricula: avaliador.matricula ?? "",
        }}
      />
    </div>
  );
}
