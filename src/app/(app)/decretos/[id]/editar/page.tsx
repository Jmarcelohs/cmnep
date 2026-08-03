import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { editarDecretoTituloHonorario } from "../../actions";
import { DecretoForm } from "../../decreto-form";

export default async function EditarDecretoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin" && usuario?.papel !== "ordenador_despesa") redirect("/decretos");

  const supabase = await createClient();
  const { data: decreto } = await supabase
    .from("decretos_titulo_honorario")
    .select("*")
    .eq("id", id)
    .single();

  if (!decreto) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">
        Editar decreto nº {decreto.numero}/{decreto.ano}
      </h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <DecretoForm
        action={editarDecretoTituloHonorario.bind(null, id)}
        submitLabel="Salvar alterações"
        valoresIniciais={{
          numero: decreto.numero,
          data_decreto: decreto.data_decreto,
          tratamento: decreto.tratamento,
          nome_homenageado: decreto.nome_homenageado,
          autor_nome: decreto.autor_nome,
          autor_partido: decreto.autor_partido ?? "",
          dotacao_orcamentaria: decreto.dotacao_orcamentaria,
          justificativa: decreto.justificativa,
        }}
      />
    </div>
  );
}
