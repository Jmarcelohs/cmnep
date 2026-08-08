import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { criarOficio } from "../actions";
import { salvarModelo } from "../modelos-actions";
import { OficioForm } from "../oficio-form";

export default async function NovoOficioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; modeloSalvo?: string }>;
}) {
  const { error, modeloSalvo } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (
    usuario?.papel !== "admin" &&
    usuario?.papel !== "ordenador_despesa" &&
    usuario?.papel !== "servidor" &&
    usuario?.papel !== "estagiario"
  )
    redirect("/oficios");

  const supabase = await createClient();
  const [{ data: vereadores }, { data: autoridades }, { data: modelos }] = await Promise.all([
    supabase.from("pessoas").select("nome").eq("categoria", "Vereador").eq("ativo", true).order("nome"),
    supabase
      .from("autoridades")
      .select("tratamento, nome, cargo, cidade_uf")
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("oficios_modelos")
      .select("id, nome_modelo, tipo, assunto, corpo_texto, paragrafo_fechamento")
      .order("nome_modelo"),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Novo ofício</h1>
      <p className="mt-1 text-sm text-slate-500">
        Escolha o tipo — a frase de abertura é preenchida automaticamente, só continue o texto na prévia.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {modeloSalvo && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Modelo salvo.
        </p>
      )}

      <OficioForm
        action={criarOficio}
        actionSalvarModelo={salvarModelo.bind(null, "/oficios/novo")}
        nomesVereadores={(vereadores ?? []).map((v) => v.nome)}
        autoridades={autoridades ?? []}
        modelos={modelos ?? []}
      />
    </div>
  );
}
