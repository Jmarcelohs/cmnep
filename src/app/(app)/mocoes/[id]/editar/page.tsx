import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { editarMocao } from "../../actions";
import { MocaoForm } from "../../mocao-form";
import { LABEL_TIPO_MOCAO } from "@/lib/mocoes/documento";

export default async function EditarMocaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin" && usuario?.papel !== "ordenador_despesa") redirect("/mocoes");

  const supabase = await createClient();
  const [{ data: mocao }, { data: vereadores }] = await Promise.all([
    supabase.from("mocoes").select("*").eq("id", id).single(),
    supabase
      .from("vereadores")
      .select("id, nome, partido, genero, presidente")
      .eq("ativo", true)
      .order("nome"),
  ]);

  if (!mocao) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">
        Editar {LABEL_TIPO_MOCAO[mocao.tipo].toLowerCase()}
      </h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <MocaoForm
        action={editarMocao.bind(null, id)}
        vereadores={vereadores ?? []}
        submitLabel="Salvar alterações"
        valoresIniciais={{
          tipo: mocao.tipo,
          data_mocao: mocao.data_mocao,
          destinatario: mocao.destinatario,
          destinatario_tratamento: mocao.destinatario_tratamento ?? "Sr.",
          autor_vereador_id: mocao.autor_vereador_id,
          associados_vereadores_ids: mocao.associados_vereadores_ids ?? [],
          justificativa: mocao.justificativa,
        }}
      />
    </div>
  );
}
