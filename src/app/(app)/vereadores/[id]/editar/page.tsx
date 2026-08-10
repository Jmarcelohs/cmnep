import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { editarVereador } from "../../actions";
import { VereadorForm } from "../../vereador-form";
import { VereadorAssinaturaForm } from "../../vereador-assinatura-form";

export default async function EditarVereadorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/vereadores");

  const supabase = await createClient();
  const { data: vereador } = await supabase.from("vereadores").select("*").eq("id", id).single();

  if (!vereador) notFound();

  let assinaturaUrlAtual: string | null = null;
  if (vereador.assinatura_caminho) {
    const { data } = await supabase.storage
      .from("vereadores-assinaturas")
      .createSignedUrl(vereador.assinatura_caminho, 300);
    assinaturaUrlAtual = data?.signedUrl ?? null;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Editar vereador</h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="mt-6">
        <VereadorAssinaturaForm vereadorId={id} assinaturaUrlAtual={assinaturaUrlAtual} />
      </div>

      <VereadorForm
        action={editarVereador.bind(null, id)}
        submitLabel="Salvar alterações"
        valoresIniciais={{
          nome: vereador.nome,
          partido: vereador.partido ?? "",
          presidente: vereador.presidente,
        }}
      />
    </div>
  );
}
