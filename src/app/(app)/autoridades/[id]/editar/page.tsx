import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { editarAutoridade } from "../../actions";
import { AutoridadeForm } from "../../autoridade-form";

export default async function EditarAutoridadePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorMsg } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/autoridades");

  const supabase = await createClient();
  const { data: autoridade } = await supabase
    .from("autoridades")
    .select("id, tratamento, nome, cargo, cidade_uf")
    .eq("id", id)
    .single();

  if (!autoridade) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Editar autoridade</h1>
      <p className="mt-1 text-sm text-slate-500">{autoridade.nome}</p>

      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <AutoridadeForm
        action={editarAutoridade.bind(null, id)}
        submitLabel="Salvar alterações"
        valoresIniciais={{
          tratamento: autoridade.tratamento,
          nome: autoridade.nome,
          cargo: autoridade.cargo,
          cidade_uf: autoridade.cidade_uf ?? "",
        }}
      />
    </div>
  );
}
