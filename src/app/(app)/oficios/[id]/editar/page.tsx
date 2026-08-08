import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { editarOficio } from "../../actions";
import { salvarModelo } from "../../modelos-actions";
import { OficioForm } from "../../oficio-form";
import { OficioAnexosForm } from "../oficio-anexos-form";

export default async function EditarOficioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; modeloSalvo?: string }>;
}) {
  const { id } = await params;
  const { error, modeloSalvo } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin" && usuario?.papel !== "ordenador_despesa") redirect("/oficios");

  const supabase = await createClient();
  const [{ data: oficio }, { data: vereadores }, { data: autoridades }, { data: anexos }, { data: modelos }] =
    await Promise.all([
      supabase.from("oficios").select("*").eq("id", id).single(),
      supabase.from("pessoas").select("nome").eq("categoria", "Vereador").eq("ativo", true).order("nome"),
      supabase
        .from("autoridades")
        .select("tratamento, nome, cargo, cidade_uf")
        .eq("ativo", true)
        .order("nome"),
      supabase
        .from("oficios_anexos")
        .select("id, nome_original, tipo, caminho")
        .eq("oficio_id", id)
        .order("criado_em", { ascending: true }),
      supabase
        .from("oficios_modelos")
        .select("id, nome_modelo, tipo, assunto, corpo_texto, paragrafo_fechamento")
        .order("nome_modelo"),
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
      {modeloSalvo && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Modelo salvo.
        </p>
      )}

      <OficioForm
        action={editarOficio.bind(null, id)}
        actionSalvarModelo={salvarModelo.bind(null, `/oficios/${id}/editar`)}
        submitLabel="Salvar alterações"
        nomesVereadores={(vereadores ?? []).map((v) => v.nome)}
        autoridades={autoridades ?? []}
        modelos={modelos ?? []}
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

      <div className="mt-6">
        <OficioAnexosForm oficioId={id} anexos={anexos ?? []} />
      </div>
    </div>
  );
}
