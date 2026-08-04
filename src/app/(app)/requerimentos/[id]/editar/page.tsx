import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { editarReembolso } from "../../actions";
import { ReembolsoForm } from "../../reembolso-form";
import type { CargoDeclarado, SubassuntoReembolso } from "@/lib/supabase/database.types";

export default async function EditarReembolsoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await createClient();
  const usuario = await getCurrentUsuario();

  const { data: requerimento } = await supabase
    .from("requerimentos_reembolso")
    .select("*")
    .eq("id", id)
    .single();

  if (!requerimento) notFound();

  const { data: minhaPessoa } = usuario
    ? await supabase.from("pessoas").select("id").eq("usuario_id", usuario.id).maybeSingle()
    : { data: null };

  const podeEditar =
    usuario?.papel === "admin" ||
    usuario?.papel === "gestor_diarias" ||
    minhaPessoa?.id === requerimento.pessoa_id;
  if (!podeEditar) redirect(`/requerimentos/${id}`);

  const [{ data: pessoas }, { data: sensiveis }, { data: diarias }, { data: veiculos }] = await Promise.all([
    supabase.from("pessoas").select("id, nome, cargo, categoria").eq("ativo", true).order("nome"),
    supabase.from("pessoas_dados_sensiveis").select("pessoa_id, cpf"),
    supabase
      .from("diarias_solicitacoes")
      .select("id, pessoa_id, numero_diaria, municipio_destino")
      .eq("status", "Autorizado")
      .order("data_partida", { ascending: false }),
    supabase
      .from("veiculos_locacao_solicitacoes")
      .select("id, numero, ano, veiculo_descricao")
      .order("ano", { ascending: false })
      .order("numero", { ascending: false }),
  ]);

  const cpfPorPessoa = new Map((sensiveis ?? []).map((s) => [s.pessoa_id, s.cpf]));
  const pessoasComCpf = (pessoas ?? []).map((p) => ({
    ...p,
    cpf: cpfPorPessoa.get(p.id) ?? null,
  }));

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">
        Editar requerimento {requerimento.protocolo}
      </h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <ReembolsoForm
        action={editarReembolso.bind(null, id)}
        pessoas={pessoasComCpf}
        diarias={diarias ?? []}
        veiculos={veiculos ?? []}
        pessoaFixaId={requerimento.pessoa_id}
        submitLabel="Salvar alterações"
        valoresIniciais={{
          protocolo: requerimento.protocolo,
          pessoa_id: requerimento.pessoa_id,
          cargo_declarado: requerimento.cargo_declarado as CargoDeclarado,
          cpf: requerimento.cpf ?? "",
          subassunto: requerimento.subassunto as SubassuntoReembolso,
          data_requerimento: requerimento.data_requerimento,
          data_ida: requerimento.data_ida,
          data_volta: requerimento.data_volta,
          municipio: requerimento.municipio,
          valor: Number(requerimento.valor),
          solicitacao_diaria_id: requerimento.solicitacao_diaria_id ?? "",
          solicitacao_veiculo_id: requerimento.solicitacao_veiculo_id ?? "",
          placa_veiculo: requerimento.placa_veiculo ?? "",
          modelo_veiculo: requerimento.modelo_veiculo ?? "",
        }}
      />
    </div>
  );
}
