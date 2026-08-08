import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import type { StatusDiaria } from "@/lib/supabase/database.types";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { MenuAcoes } from "@/components/menu-acoes";
import { CampoBusca } from "@/components/campo-busca";
import { Paginacao } from "@/components/paginacao";
import { buscarIdsPessoasPorNome, construirFiltroBusca } from "@/lib/busca";
import { buscarDiariasAtrasadas } from "@/lib/dashboard/diarias-atrasadas";
import { calcularPagina, totalDePaginas } from "@/lib/paginacao";
import { excluirSolicitacao } from "./actions";
import { excluirPrestacaoContas } from "./prestacao-contas-actions";

const STATUS_STYLES: Record<string, string> = {
  Solicitado: "bg-amber-50 text-amber-700",
  Autorizado: "bg-emerald-50 text-emerald-700",
  Indeferido: "bg-red-50 text-red-700",
};

export default async function DiariasPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    prestacao?: string;
    busca?: string;
    ano?: string;
    pagina?: string;
    error?: string;
  }>;
}) {
  const { status, prestacao, busca, ano: anoParam, pagina: paginaStr, error: errorMsg } =
    await searchParams;
  const supabase = await createClient();
  const usuario = await getCurrentUsuario();

  const anoAtual = new Date().getFullYear();
  const anoSelecionado = anoParam === "todos" ? null : Number(anoParam) || anoAtual;

  const { data: minhaPessoa } = usuario
    ? await supabase.from("pessoas").select("id").eq("usuario_id", usuario.id).maybeSingle()
    : { data: null };

  const diariasAtrasadas = await buscarDiariasAtrasadas(supabase, usuario);

  const podeEditarSempre =
    usuario?.papel === "admin" ||
    usuario?.papel === "ordenador_despesa" ||
    usuario?.papel === "gestor_diarias";

  const { pagina, de, ate } = calcularPagina(paginaStr);

  let query = supabase
    .from("diarias_solicitacoes")
    .select(
      "id, pessoa_id, numero_diaria, numero_solicitacao, municipio_destino, finalidade, status, total, data_solicitacao, pessoas(nome), diarias_prestacoes_contas(id, parecer, data_autenticacao_beneficiario)",
      { count: "exact" },
    )
    .order("criado_em", { ascending: false })
    .range(de, ate);

  if (status) query = query.eq("status", status as StatusDiaria);
  if (anoSelecionado) {
    query = query
      .gte("data_solicitacao", `${anoSelecionado}-01-01`)
      .lt("data_solicitacao", `${anoSelecionado + 1}-01-01`);
  }
  if (busca) {
    const idsPessoas = await buscarIdsPessoasPorNome(supabase, busca);
    query = query.or(
      construirFiltroBusca(busca, ["municipio_destino", "finalidade"], {
        coluna: "pessoa_id",
        ids: idsPessoas,
      }),
    );
  }

  if (prestacao) {
    query = query.eq("status", "Autorizado");
    const { data: prestacoes } = await supabase
      .from("diarias_prestacoes_contas")
      .select("solicitacao_id, data_autenticacao_beneficiario");
    // "Pendente" inclui rascunho (prestação existe mas ainda não foi
    // enviada oficialmente) — só sai da fila quando realmente enviada.
    const idsEnviadas = (prestacoes ?? [])
      .filter((p) => p.data_autenticacao_beneficiario)
      .map((p) => p.solicitacao_id)
      .filter((id): id is string => Boolean(id));
    if (prestacao === "pendente") {
      if (idsEnviadas.length > 0) {
        query = query.not("id", "in", `(${idsEnviadas.join(",")})`);
      }
    } else if (prestacao === "realizada") {
      query =
        idsEnviadas.length > 0
          ? query.in("id", idsEnviadas)
          : query.eq("id", "00000000-0000-0000-0000-000000000000");
    }
  }

  const { data: solicitacoes, error, count } = await query;

  const { data: todasDatas } = await supabase.from("diarias_solicitacoes").select("data_solicitacao");
  const anosDisponiveis = Array.from(
    new Set([anoAtual, ...(todasDatas ?? []).map((d) => Number(d.data_solicitacao?.slice(0, 4)))]),
  )
    .filter(Boolean)
    .sort((a, b) => b - a);

  const paramsFiltro = new URLSearchParams({
    ...(prestacao ? { prestacao } : {}),
    ...(busca ? { busca } : {}),
    ...(anoParam ? { ano: anoParam } : {}),
  });
  const paramsBase = new URLSearchParams({
    ...(status ? { status } : {}),
    ...(prestacao ? { prestacao } : {}),
    ...(busca ? { busca } : {}),
    ...(anoParam ? { ano: anoParam } : {}),
  });
  const paramsCsv = paramsBase.toString();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-navy">Diárias de Viagem</h1>
        <Link
          href="/diarias/nova"
          className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
        >
          Nova solicitação
        </Link>
      </div>

      {diariasAtrasadas.minhas.length > 0 && (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Você tem {diariasAtrasadas.minhas.length}{" "}
          {diariasAtrasadas.minhas.length === 1 ? "diária" : "diárias"} com prestação de contas
          atrasada (3+ dias úteis do retorno) —{" "}
          <Link href="/diarias?prestacao=pendente" className="font-medium underline">
            ver
          </Link>
          .
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {["Solicitado", "Autorizado", "Indeferido"].map((s) => (
          <Link
            key={s}
            href={`/diarias?${paramsFiltro.toString()}&status=${s}`}
            className={`rounded-full px-3 py-1 ${status === s && !prestacao ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {s}
          </Link>
        ))}
        <Link
          href={`/diarias?${paramsFiltro.toString()}`}
          className={`rounded-full px-3 py-1 ${!status && !prestacao ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Todas
        </Link>
        <span className="mx-1 self-center text-slate-300">|</span>
        <Link
          href="/diarias?prestacao=pendente"
          className={`rounded-full px-3 py-1 ${prestacao === "pendente" ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Prestação de contas pendente
        </Link>
        <Link
          href="/diarias?prestacao=realizada"
          className={`rounded-full px-3 py-1 ${prestacao === "realizada" ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Prestação de contas realizada
        </Link>
      </div>

      <form className="mt-4 flex flex-wrap items-end gap-3 text-sm" action="/diarias">
        <CampoBusca defaultValue={busca} placeholder="Solicitante, destino ou finalidade" />
        <div>
          <label htmlFor="filtro-ano" className="block text-xs font-medium text-slate-500">Ano</label>
          <select
            id="filtro-ano"
            name="ano"
            defaultValue={anoParam ?? String(anoAtual)}
            className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="todos">Todos os anos</option>
            {anosDisponiveis.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        {status && <input type="hidden" name="status" value={status} />}
        {prestacao && <input type="hidden" name="prestacao" value={prestacao} />}
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Filtrar
        </button>
        <a
          href={`/api/diarias/csv?${paramsCsv}`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Exportar CSV
        </a>
      </form>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Erro ao carregar solicitações: {error.message}
        </p>
      )}
      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Solicitante</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Destino</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Finalidade</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Total</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {solicitacoes?.map((s) => {
              const podeEditar = podeEditarSempre || minhaPessoa?.id === s.pessoa_id;
              const prestacaoDaLinha = (s.diarias_prestacoes_contas ?? [])[0];
              const temPrestacao = Boolean(prestacaoDaLinha);
              const prestacaoRascunho = temPrestacao && !prestacaoDaLinha!.data_autenticacao_beneficiario;
              const podeGerenciarPrestacao =
                usuario?.papel === "admin" ||
                usuario?.papel === "gestor_diarias" ||
                minhaPessoa?.id === s.pessoa_id;
              return (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <Link href={`/diarias/${s.id}`} className="block text-slate-900">
                      {(s.pessoas as unknown as { nome: string } | null)?.nome ?? "—"}
                    </Link>
                    {(s.numero_diaria || s.numero_solicitacao) && (
                      <span className="block text-xs text-slate-500">
                        {s.numero_diaria && <>Diária nº {s.numero_diaria}</>}
                        {s.numero_diaria && s.numero_solicitacao && " · "}
                        {s.numero_solicitacao && <>Solicitação nº {s.numero_solicitacao}</>}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-slate-700">{s.municipio_destino ?? "—"}</td>
                  <td className="px-4 py-2 text-justify text-slate-700">{s.finalidade ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-700">
                    {Number(s.total ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[s.status] ?? ""}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <MenuAcoes>
                      {podeEditar && (
                        <Link
                          href={`/diarias/${s.id}/editar`}
                          className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Editar
                        </Link>
                      )}
                      <DownloadPdfButton
                        variant="menu"
                        url={`/api/diarias/${s.id}/pdf`}
                        nomeArquivoPadrao={`anexo-i-${s.id}.pdf`}
                      />
                      {s.status === "Autorizado" && (
                        <>
                          <Link
                            href={`/diarias/${s.id}/prestacao-contas`}
                            className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            {!temPrestacao
                              ? "Prestar contas"
                              : prestacaoRascunho
                                ? "Continuar rascunho"
                                : "Ver prestação"}
                          </Link>
                          {temPrestacao && podeGerenciarPrestacao && (
                            <>
                              <Link
                                href={`/diarias/${s.id}/prestacao-contas/editar`}
                                className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                Editar prestação
                              </Link>
                              <DownloadPdfButton
                                variant="menu"
                                url={`/api/diarias/${s.id}/prestacao-contas/pdf`}
                                nomeArquivoPadrao={`anexo-ii-${s.id}.pdf`}
                                label="Salvar PDF (Anexo II)"
                              />
                              <ExcluirSolicitacaoButton
                                variant="menu"
                                action={excluirPrestacaoContas.bind(
                                  null,
                                  prestacaoDaLinha!.id,
                                  s.id,
                                )}
                                label="Excluir prestação"
                                mensagemConfirmacao="Tem certeza que deseja excluir essa prestação de contas? Todos os anexos e pagamentos registrados também serão apagados. Essa ação não pode ser desfeita."
                              />
                            </>
                          )}
                        </>
                      )}
                      {podeEditar && (
                        <ExcluirSolicitacaoButton
                          variant="menu"
                          action={excluirSolicitacao.bind(null, s.id)}
                        />
                      )}
                    </MenuAcoes>
                  </td>
                </tr>
              );
            })}
            {solicitacoes?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Paginacao
        pagina={pagina}
        totalPaginas={totalDePaginas(count)}
        count={count}
        baseHref="/diarias"
        paramsBase={paramsBase}
      />
    </div>
  );
}
