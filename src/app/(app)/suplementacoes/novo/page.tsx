import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { rotuloFicha } from "@/lib/suplementacoes/documento";
import { criarSuplementacao } from "../actions";
import { SuplementacaoForm } from "../suplementacao-form";

export default async function NovaSuplementacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: dotacoes } = await supabase
    .from("dotacoes_orcamentarias")
    .select("*")
    .eq("ativo", true)
    .order("ficha");

  const fichas = (dotacoes ?? []).map((d) => ({ id: d.id, ficha: d.ficha, rotulo: rotuloFicha(d) }));

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Nova suplementação orçamentária</h1>
      <p className="mt-1 text-sm text-slate-500">
        Gera o Ato da Mesa Diretora e o Decreto de suplementação a partir das mesmas fichas e valores.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {fichas.length === 0 && (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Nenhuma ficha orçamentária cadastrada ainda.
        </p>
      )}

      <SuplementacaoForm action={criarSuplementacao} fichas={fichas} />
    </div>
  );
}
