import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { editarOficio } from "../../actions";
import { OficioForm } from "../../oficio-form";

export default async function EditarOficioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin" && usuario?.papel !== "ordenador_despesa") redirect("/oficios");

  const supabase = await createClient();
  const [{ data: oficio }, { data: vereadores }] = await Promise.all([
    supabase.from("oficios").select("*").eq("id", id).single(),
    supabase.from("pessoas").select("nome").eq("categoria", "Vereador").eq("ativo", true).order("nome"),
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

      <OficioForm
        action={editarOficio.bind(null, id)}
        submitLabel="Salvar alterações"
        nomesVereadores={(vereadores ?? []).map((v) => v.nome)}
        valoresIniciais={{
          tipo: oficio.tipo,
          numero: oficio.numero,
          data_oficio: oficio.data_oficio,
          destinatario_tratamento: oficio.destinatario_tratamento,
          destinatario_nome: oficio.destinatario_nome,
          destinatario_cargo: oficio.destinatario_cargo,
          destinatario_cidade_uf: oficio.destinatario_cidade_uf ?? "",
          saudacao: oficio.saudacao,
          assunto: oficio.assunto,
          autor_nome: oficio.autor_nome ?? "",
          autor_genero: oficio.autor_genero ?? "Vereador",
          autor_associado_nome: oficio.autor_associado_nome ?? "",
          autor_associado_genero: oficio.autor_associado_genero ?? "Vereador",
          corpo_texto: oficio.corpo_texto,
          evento_data: oficio.evento_data ?? "",
          evento_hora: oficio.evento_hora ?? "",
          evento_local: oficio.evento_local ?? "",
          paragrafo_fechamento: oficio.paragrafo_fechamento,
        }}
      />
    </div>
  );
}
