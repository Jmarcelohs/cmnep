import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { editarPrestacaoContas } from "../../../prestacao-contas-actions";
import { NovaPrestacaoForm } from "../nova-prestacao-form";

export default async function EditarPrestacaoContasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorMsg } = await searchParams;
  const supabase = await createClient();
  const usuario = await getCurrentUsuario();

  const { data: prestacao } = await supabase
    .from("diarias_prestacoes_contas")
    .select("*, pessoas(nome, cargo)")
    .eq("solicitacao_id", id)
    .single();

  if (!prestacao) notFound();

  const { data: minhaPessoa } = usuario
    ? await supabase.from("pessoas").select("id").eq("usuario_id", usuario.id).maybeSingle()
    : { data: null };

  const podeEditar =
    usuario?.papel === "admin" ||
    usuario?.papel === "gestor_diarias" ||
    minhaPessoa?.id === prestacao.pessoa_id;
  if (!podeEditar) redirect(`/diarias/${id}/prestacao-contas`);

  const pessoa = prestacao.pessoas as unknown as { nome: string; cargo: string } | null;

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">
        Editar prestação de contas — {pessoa?.nome ?? "—"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{pessoa?.cargo}</p>

      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <NovaPrestacaoForm
        action={editarPrestacaoContas.bind(null, prestacao.id, id)}
        valorAutorizado={0}
        submitLabel="Salvar alterações"
        mostrarDeclaracao={false}
        valoresIniciais={{
          relatorio_resultado: prestacao.relatorio_resultado ?? "",
          debito_diarias_previstas: Number(prestacao.debito_diarias_previstas),
          debito_diarias_nao_previstas: Number(prestacao.debito_diarias_nao_previstas),
          debito_transporte_aereo: Number(prestacao.debito_transporte_aereo),
          debito_transporte_urbano: Number(prestacao.debito_transporte_urbano),
          credito_recebidas_antecipadamente: Number(prestacao.credito_recebidas_antecipadamente),
          credito_reembolsar: Number(prestacao.credito_reembolsar),
          credito_transporte_urbano: Number(prestacao.credito_transporte_urbano),
          credito_devolver: Number(prestacao.credito_devolver),
        }}
      />
    </div>
  );
}
