import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { getTemplate } from "@/lib/avaliacoes/templates";
import { editarAvaliacao } from "../../actions";
import { AvaliacaoForm } from "../../avaliacao-form";

export default async function EditarAvaliacaoPage({
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
  const [{ data: avaliacao }, { data: pessoas }, { data: avaliadores }] = await Promise.all([
    supabase
      .from("avaliacoes")
      .select(
        "id, pessoa_id, ano, periodo, template, data_avaliacao, avaliadores, itens, pontos_melhorar, pontos_positivos",
      )
      .eq("id", id)
      .single(),
    supabase
      .from("pessoas")
      .select("id, nome, matricula, categoria")
      .in("categoria", ["Efetivo", "Comissionado"])
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("avaliacoes_avaliadores")
      .select("id, nome, matricula")
      .eq("ativo", true)
      .order("nome"),
  ]);

  if (!avaliacao) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Editar avaliação</h1>

      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <AvaliacaoForm
        action={editarAvaliacao.bind(null, id)}
        template={getTemplate(avaliacao.template)}
        pessoas={pessoas ?? []}
        avaliadoresCadastro={avaliadores ?? []}
        submitLabel="Salvar alterações"
        valoresIniciais={{
          pessoa_id: avaliacao.pessoa_id,
          ano: String(avaliacao.ano),
          periodo: avaliacao.periodo,
          data_avaliacao: avaliacao.data_avaliacao,
          avaliadores: avaliacao.avaliadores,
          itens: avaliacao.itens,
          pontos_melhorar: avaliacao.pontos_melhorar ?? "",
          pontos_positivos: avaliacao.pontos_positivos ?? "",
        }}
      />
    </div>
  );
}
