import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { autorizarSolicitacao, indeferirSolicitacao, excluirSolicitacao } from "../actions";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { calcularVerificacoes } from "@/lib/diarias/verificacoes";

const VERIFICACAO_ESTILO: Record<string, string> = {
  ok: "bg-emerald-50 text-emerald-700",
  atencao: "bg-amber-50 text-amber-700",
  indisponivel: "bg-slate-100 text-slate-500",
};

const VERIFICACAO_LABEL: Record<string, string> = {
  ok: "OK",
  atencao: "Atenção",
  indisponivel: "Manual",
};

export default async function DetalheSolicitacaoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const usuario = await getCurrentUsuario();

  const { data: solicitacao } = await supabase
    .from("diarias_solicitacoes")
    .select("*, pessoas(nome, cargo, categoria)")
    .eq("id", id)
    .single();

  if (!solicitacao) notFound();

  const { data: itens } = await supabase
    .from("diarias_itens")
    .select("*")
    .eq("solicitacao_id", id);

  const podeAutorizar =
    solicitacao.status === "Solicitado" &&
    (usuario?.papel === "ordenador_despesa" ||
      usuario?.papel === "admin" ||
      usuario?.papel === "gestor_diarias");

  const { data: minhaPessoa } = usuario
    ? await supabase.from("pessoas").select("id").eq("usuario_id", usuario.id).maybeSingle()
    : { data: null };

  const podeEditar =
    usuario?.papel === "admin" ||
    usuario?.papel === "ordenador_despesa" ||
    usuario?.papel === "gestor_diarias" ||
    minhaPessoa?.id === solicitacao.pessoa_id;

  const pessoa = solicitacao.pessoas as unknown as {
    nome: string;
    cargo: string;
    categoria: string;
  } | null;

  const { data: prestacaoExistente } =
    solicitacao.status === "Autorizado"
      ? await supabase
          .from("diarias_prestacoes_contas")
          .select("id")
          .eq("solicitacao_id", id)
          .maybeSingle()
      : { data: null };

  let verificacoes: ReturnType<typeof calcularVerificacoes> = [];
  if (solicitacao.status === "Solicitado") {
    const { data: anteriores } = await supabase
      .from("diarias_solicitacoes")
      .select("id, diarias_prestacoes_contas(parecer)")
      .eq("pessoa_id", solicitacao.pessoa_id)
      .eq("status", "Autorizado")
      .neq("id", id);

    const temPendenciaAnterior = (anteriores ?? []).some((s) => {
      const prestacoes = s.diarias_prestacoes_contas as unknown as { parecer: string | null }[];
      return prestacoes.length === 0 || !prestacoes.some((p) => p.parecer);
    });

    const faixasItens = (itens ?? [])
      .filter((i) => i.modo === "tabela" && i.faixa)
      .map((i) => i.faixa as string);

    verificacoes = calcularVerificacoes({
      dataSolicitacao: solicitacao.data_solicitacao,
      dataPartida: solicitacao.data_partida,
      faixasItens,
      temPendenciaAnterior,
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">
            Solicitação de {pessoa?.nome ?? "—"}
          </h1>
          <p className="text-sm text-slate-500">{pessoa?.cargo}</p>
        </div>
        <div className="flex items-center gap-3">
          {podeEditar && (
            <Link
              href={`/diarias/${id}/editar`}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Editar
            </Link>
          )}
          <Link
            href={`/diarias/${id}/imprimir`}
            target="_blank"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Imprimir (Anexo I)
          </Link>
          {solicitacao.status === "Autorizado" && (
            <Link
              href={`/diarias/${id}/prestacao-contas`}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {prestacaoExistente ? "Ver prestação de contas" : "Prestar contas"}
            </Link>
          )}
          {podeEditar && (
            <ExcluirSolicitacaoButton action={excluirSolicitacao.bind(null, id)} size="md" />
          )}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            {solicitacao.status}
          </span>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Número da diária</dt>
          <dd className="text-slate-900">{solicitacao.numero_diaria ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Número da solicitação</dt>
          <dd className="text-slate-900">{solicitacao.numero_solicitacao ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Destino</dt>
          <dd className="text-slate-900">{solicitacao.municipio_destino ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Instituição</dt>
          <dd className="text-slate-900">{solicitacao.instituicao_destino ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Partida</dt>
          <dd className="text-slate-900">{solicitacao.data_partida ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Chegada</dt>
          <dd className="text-slate-900">{solicitacao.data_chegada ?? "—"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-500">Finalidade</dt>
          <dd className="text-slate-900">{solicitacao.finalidade ?? "—"}</dd>
        </div>
      </dl>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Item</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Qtd.</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Valor unit.</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {itens?.map((item) => (
              <tr key={item.id}>
                <td className="px-4 py-2 text-slate-900">
                  {item.modo === "tabela"
                    ? `${item.tipo === "comPernoite" ? "Com pernoite" : "Sem pernoite"} — ${item.faixa}`
                    : item.descricao_manual}
                </td>
                <td className="px-4 py-2 text-slate-700">{item.quantidade}</td>
                <td className="px-4 py-2 text-slate-700">
                  {Number(item.valor_unitario).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </td>
                <td className="px-4 py-2 text-slate-700">
                  {(item.quantidade * Number(item.valor_unitario)).toLocaleString("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="border-t border-slate-200 px-4 py-3 text-right text-sm font-semibold text-slate-900">
          Total: {Number(solicitacao.total ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
      </div>

      {verificacoes.length > 0 && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-slate-900">
            Verificações (art. 4º da Resolução 40/2023)
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Avisos informativos — não bloqueiam a autorização, a decisão final continua sendo do
            ordenador da despesa.
          </p>
          <ul className="mt-3 space-y-2">
            {verificacoes.map((v) => (
              <li key={v.titulo} className="flex items-start gap-2 text-sm">
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium ${VERIFICACAO_ESTILO[v.status]}`}
                >
                  {VERIFICACAO_LABEL[v.status]}
                </span>
                <span>
                  <strong className="text-slate-900">{v.titulo}:</strong>{" "}
                  <span className="text-slate-600">{v.descricao}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {podeAutorizar && (
        <div className="mt-6 flex flex-wrap items-end gap-3">
          <form action={autorizarSolicitacao.bind(null, id)} className="flex items-end gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-500">Data da autorização</label>
              <input
                type="date"
                name="data_autorizacao"
                required
                className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Autorizar
            </button>
          </form>
          <form action={indeferirSolicitacao.bind(null, id)}>
            <button
              type="submit"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Indeferir
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
