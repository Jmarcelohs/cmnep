import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { editarLocacao } from "../../actions";
import { VeiculoLocacaoForm } from "../../veiculo-locacao-form";

export default async function EditarLocacaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (
    usuario?.papel !== "admin" &&
    usuario?.papel !== "ordenador_despesa" &&
    usuario?.papel !== "gestor_diarias"
  )
    redirect("/veiculos");

  const supabase = await createClient();
  const { data: locacao } = await supabase
    .from("veiculos_locacao_solicitacoes")
    .select("*")
    .eq("id", id)
    .single();

  if (!locacao) notFound();

  const [{ data: pessoas }, { data: itens }] = await Promise.all([
    supabase.from("pessoas").select("id, nome, matricula, cargo").eq("ativo", true).order("nome"),
    supabase
      .from("veiculos_locacao_itens")
      .select("id, codigo, descricao, faixa_km, valor_diaria")
      .eq("ativo", true)
      .order("codigo"),
  ]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">
        Editar solicitação {locacao.numero}/{locacao.ano}
      </h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <VeiculoLocacaoForm
        action={editarLocacao.bind(null, id)}
        pessoas={pessoas ?? []}
        itens={itens ?? []}
        submitLabel="Salvar alterações"
        valoresIniciais={{
          numero: locacao.numero,
          data_pedido: locacao.data_pedido,
          processo: locacao.processo,
          locadora: locacao.locadora,
          pessoa_solicitante_id: locacao.pessoa_solicitante_id ?? "",
          solicitante_nome: locacao.solicitante_nome,
          solicitante_matricula: locacao.solicitante_matricula ?? "",
          solicitante_cargo: locacao.solicitante_cargo ?? "",
          pessoa_condutor_id: locacao.pessoa_condutor_id ?? "",
          condutor_nome: locacao.condutor_nome,
          condutor_matricula: locacao.condutor_matricula ?? "",
          condutor_cargo: locacao.condutor_cargo ?? "",
          item_id: locacao.item_id ?? "",
          veiculo_descricao: locacao.veiculo_descricao,
          valor_diaria: Number(locacao.valor_diaria),
          qtd_diarias: locacao.qtd_diarias,
          data_retirada: locacao.data_retirada,
          hora_retirada: locacao.hora_retirada ?? "",
          local_retirada: locacao.local_retirada ?? "",
          data_devolucao: locacao.data_devolucao,
          hora_devolucao: locacao.hora_devolucao ?? "",
          local_devolucao: locacao.local_devolucao ?? "",
          observacoes: locacao.observacoes ?? "",
        }}
      />
    </div>
  );
}
