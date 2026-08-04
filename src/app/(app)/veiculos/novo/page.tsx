import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { criarLocacao } from "../actions";
import { VeiculoLocacaoForm } from "../veiculo-locacao-form";

export default async function NovaLocacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (
    usuario?.papel !== "admin" &&
    usuario?.papel !== "ordenador_despesa" &&
    usuario?.papel !== "gestor_diarias"
  )
    redirect("/veiculos");

  const supabase = await createClient();
  const [{ data: pessoas }, { data: itens }] = await Promise.all([
    supabase.from("pessoas").select("id, nome, matricula, cargo").eq("ativo", true).order("nome"),
    supabase
      .from("veiculos_locacao_itens")
      .select("id, codigo, descricao, faixa_km, valor_diaria")
      .eq("ativo", true)
      .order("codigo"),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Nova solicitação de locação de veículo</h1>
      <p className="mt-1 text-sm text-slate-500">
        Pregão nº 003/2026 (Processo PRC011) — Locadora LOCAMAR LTDA.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <VeiculoLocacaoForm action={criarLocacao} pessoas={pessoas ?? []} itens={itens ?? []} />
    </div>
  );
}
