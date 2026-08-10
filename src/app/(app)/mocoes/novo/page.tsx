import { redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { createClient } from "@/lib/supabase/server";
import { criarMocao } from "../actions";
import { MocaoForm } from "../mocao-form";

export default async function NovaMocaoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (
    usuario?.papel !== "admin" &&
    usuario?.papel !== "ordenador_despesa" &&
    usuario?.papel !== "servidor" &&
    usuario?.papel !== "estagiario"
  )
    redirect("/mocoes");

  const supabase = await createClient();
  const { data: vereadores } = await supabase
    .from("vereadores")
    .select("id, nome, partido, genero, presidente")
    .eq("ativo", true)
    .order("nome");

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Nova moção</h1>
      <p className="mt-1 text-sm text-slate-500">
        O texto de apresentação é padronizado conforme o tipo escolhido — só preencha os dados que variam.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <MocaoForm action={criarMocao} vereadores={vereadores ?? []} />
    </div>
  );
}
