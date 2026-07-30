import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { SolicitacaoForm } from "../../solicitacao-form";
import { editarSolicitacao } from "../../actions";

export default async function EditarSolicitacaoPage({
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

  const { data: solicitacao } = await supabase
    .from("diarias_solicitacoes")
    .select("*, pessoas(id, nome, categoria)")
    .eq("id", id)
    .single();

  if (!solicitacao) notFound();

  const pessoa = solicitacao.pessoas as unknown as {
    id: string;
    nome: string;
    categoria: string;
  } | null;

  const { data: minhaPessoa } = usuario
    ? await supabase.from("pessoas").select("id").eq("usuario_id", usuario.id).maybeSingle()
    : { data: null };

  const podeEditar =
    usuario?.papel === "admin" ||
    usuario?.papel === "ordenador_despesa" ||
    minhaPessoa?.id === solicitacao.pessoa_id;

  if (!podeEditar) redirect(`/diarias/${id}`);

  const { data: itens } = await supabase
    .from("diarias_itens")
    .select("*")
    .eq("solicitacao_id", id);

  const { data: tabelaValores } = await supabase
    .from("diarias_tabela_valores")
    .select("tipo, faixa, categoria, valor")
    .order("faixa");

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">
        Editar solicitação de {pessoa?.nome ?? "—"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Status atual: {solicitacao.status}. Editar não altera o status da solicitação.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <SolicitacaoForm
        action={editarSolicitacao.bind(null, id)}
        pessoas={pessoa ? [pessoa] : []}
        pessoaFixaId={pessoa?.id}
        tabelaValores={tabelaValores ?? []}
        submitLabel="Salvar alterações"
        valoresIniciais={{
          numero_diaria: solicitacao.numero_diaria ?? "",
          numero_solicitacao: solicitacao.numero_solicitacao ?? "",
          data_solicitacao: solicitacao.data_solicitacao ?? "",
          municipio_destino: solicitacao.municipio_destino ?? "",
          uf_destino: solicitacao.uf_destino ?? "MG",
          instituicao_destino: solicitacao.instituicao_destino ?? "",
          contato_destino: solicitacao.contato_destino ?? "",
          data_partida: solicitacao.data_partida ?? "",
          data_chegada: solicitacao.data_chegada ?? "",
          data_autorizacao: solicitacao.data_autorizacao ?? "",
          finalidade: solicitacao.finalidade ?? "",
          itens: (itens ?? []).map((item) => ({
            modo: item.modo,
            tipo: item.tipo ?? "semPernoite",
            faixa: item.faixa ?? "",
            descricao_manual: item.descricao_manual ?? "",
            quantidade: item.quantidade,
            valor_unitario: Number(item.valor_unitario),
          })),
        }}
      />
    </div>
  );
}
