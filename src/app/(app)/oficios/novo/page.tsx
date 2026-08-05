import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { criarOficio } from "../actions";
import { OficioForm } from "../oficio-form";

export default async function NovoOficioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (
    usuario?.papel !== "admin" &&
    usuario?.papel !== "ordenador_despesa" &&
    usuario?.papel !== "servidor"
  )
    redirect("/oficios");

  const supabase = await createClient();
  const { data: vereadores } = await supabase
    .from("pessoas")
    .select("nome")
    .eq("categoria", "Vereador")
    .eq("ativo", true)
    .order("nome");

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Novo ofício</h1>
      <p className="mt-1 text-sm text-slate-500">
        Escolha o tipo — a frase de abertura é preenchida automaticamente, só continue o texto na prévia.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <OficioForm action={criarOficio} nomesVereadores={(vereadores ?? []).map((v) => v.nome)} />
    </div>
  );
}
