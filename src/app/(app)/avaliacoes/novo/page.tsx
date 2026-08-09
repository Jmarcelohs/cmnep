import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { getTemplate } from "@/lib/avaliacoes/templates";
import { hojeBrasil } from "@/lib/data-brasil";
import { criarAvaliacao } from "../actions";
import { AvaliacaoForm } from "../avaliacao-form";

export default async function NovaAvaliacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; pessoa_id?: string }>;
}) {
  const { error: errorMsg, pessoa_id } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/avaliacoes");

  const supabase = await createClient();
  const [{ data: pessoas }, { data: avaliadores }] = await Promise.all([
    supabase
      .from("pessoas")
      .select("id, nome, matricula, categoria")
      .eq("categoria", "Efetivo")
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("avaliacoes_avaliadores")
      .select("id, nome, matricula")
      .eq("ativo", true)
      .order("nome"),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Nova avaliação</h1>
      <p className="mt-1 text-sm text-slate-500">
        {getTemplate("estagio_probatorio").nome}
      </p>

      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <AvaliacaoForm
        action={criarAvaliacao}
        template={getTemplate("estagio_probatorio")}
        pessoas={pessoas ?? []}
        avaliadoresCadastro={avaliadores ?? []}
        submitLabel="Salvar avaliação"
        valoresIniciais={
          pessoa_id
            ? {
                pessoa_id,
                ano: String(new Date().getFullYear()),
                periodo: "trimestre_1",
                data_avaliacao: hojeBrasil(),
                em_estagio_probatorio: true,
                avaliadores: [],
                itens: [],
                pontos_melhorar: "",
                pontos_positivos: "",
              }
            : undefined
        }
      />
    </div>
  );
}
