import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import type { StatusDiaria } from "@/lib/supabase/database.types";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { MenuAcoes } from "@/components/menu-acoes";
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
  searchParams: Promise<{ status?: string; prestacao?: string; error?: string }>;
}) {
  const { status, prestacao, error: errorMsg } = await searchParams;
  const supabase = await createClient();
  const usuario = await getCurrentUsuario();

  const { data: minhaPessoa } = usuario
    ? await supabase.from("pessoas").select("id").eq("usuario_id", usuario.id).maybeSingle()
    : { data: null };

  const podeEditarSempre = usuario?.papel === "admin" || usuario?.papel === "ordenador_despesa";

  let query = supabase
    .from("diarias_solicitacoes")
    .select(
      "id, pessoa_id, numero_diaria, numero_solicitacao, municipio_destino, finalidade, status, total, data_solicitacao, pessoas(nome), diarias_prestacoes_contas(id, parecer)",
    )
    .order("criado_em", { ascending: false });

  if (prestacao) {
    query = query.eq("status", "Autorizado");
  } else if (status) {
    query = query.eq("status", status as StatusDiaria);
  }

  const { data: brutas, error } = await query;

  const solicitacoes = brutas?.filter((s) => {
    if (prestacao === "pendente") return (s.diarias_prestacoes_contas ?? []).length === 0;
    if (prestacao === "realizada") return (s.diarias_prestacoes_contas ?? []).length > 0;
    return true;
  });

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

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {["Solicitado", "Autorizado", "Indeferido"].map((s) => (
          <Link
            key={s}
            href={`/diarias?status=${s}`}
            className={`rounded-full px-3 py-1 ${status === s && !prestacao ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {s}
          </Link>
        ))}
        <Link
          href="/diarias"
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
              <th className="px-4 py-2 text-left font-medium text-slate-500">Solicitante</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Destino</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Finalidade</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Total</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {solicitacoes?.map((s) => {
              const podeEditar = podeEditarSempre || minhaPessoa?.id === s.pessoa_id;
              const prestacaoDaLinha = (s.diarias_prestacoes_contas ?? [])[0];
              const temPrestacao = Boolean(prestacaoDaLinha);
              const podeGerenciarPrestacao =
                usuario?.papel === "admin" || minhaPessoa?.id === s.pessoa_id;
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
                  <td className="px-4 py-2 text-slate-700">{s.finalidade ?? "—"}</td>
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
                            {temPrestacao ? "Ver prestação" : "Prestar contas"}
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
    </div>
  );
}
