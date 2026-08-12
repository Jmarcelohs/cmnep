import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { editarOficioDE } from "../../actions";
import { OficioDEForm } from "../../oficio-de-form";
import { OficioDEAnexosForm } from "../oficio-de-anexos-form";

export default async function EditarOficioDEPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: oficio }, { data: anexos }] = await Promise.all([
    supabase.from("oficios_diretor_executivo").select("*").eq("id", id).single(),
    supabase
      .from("oficios_diretor_executivo_anexos")
      .select("id, nome_original, tipo, caminho")
      .eq("oficio_id", id)
      .order("criado_em", { ascending: true }),
  ]);

  if (!oficio) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">
        Editar ofício nº {oficio.numero}/{oficio.ano}
      </h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <OficioDEForm
        action={editarOficioDE.bind(null, id)}
        submitLabel="Salvar alterações"
        valoresIniciais={{
          numero: oficio.numero,
          data_oficio: oficio.data_oficio,
          destinatario_tratamento: oficio.destinatario_tratamento,
          destinatario_nome: oficio.destinatario_nome,
          destinatario_cargo: oficio.destinatario_cargo,
          destinatario_cidade_uf: oficio.destinatario_cidade_uf ?? "",
          saudacao: oficio.saudacao,
          assunto: oficio.assunto,
          corpo_texto: oficio.corpo_texto,
        }}
      />

      <div className="mt-6">
        <OficioDEAnexosForm oficioId={id} anexos={anexos ?? []} />
      </div>
    </div>
  );
}
