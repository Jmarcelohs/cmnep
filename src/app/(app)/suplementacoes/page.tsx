import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { formatarData, formatarMoeda } from "@/lib/pdf/formato";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { MenuAcoes } from "@/components/menu-acoes";
import { excluirSuplementacao } from "./actions";

export default async function SuplementacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMsg } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: suplementacoes, error } = await supabase
    .from("suplementacoes_orcamentarias")
    .select("id, data_ato, numero_decreto")
    .order("data_ato", { ascending: false });

  const ids = (suplementacoes ?? []).map((s) => s.id);
  const { data: itens } = ids.length
    ? await supabase
        .from("suplementacoes_itens")
        .select("suplementacao_id, valor")
        .eq("tipo", "destino")
        .in("suplementacao_id", ids)
    : { data: [] };

  const totalPorSuplementacao = new Map<string, number>();
  for (const item of itens ?? []) {
    totalPorSuplementacao.set(
      item.suplementacao_id,
      (totalPorSuplementacao.get(item.suplementacao_id) ?? 0) + item.valor,
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Suplementações Orçamentárias</h1>
          <p className="mt-1 text-sm text-slate-500">
            Abertura de crédito adicional suplementar — Ato da Mesa Diretora + Decreto de ratificação.
          </p>
        </div>
        <Link
          href="/suplementacoes/novo"
          className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
        >
          Nova suplementação
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Erro ao carregar: {error.message}
        </p>
      )}
      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Data do Ato</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Valor</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Decreto</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {suplementacoes?.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-900">{formatarData(s.data_ato)}</td>
                <td className="px-4 py-2 text-slate-700">
                  {formatarMoeda(totalPorSuplementacao.get(s.id) ?? 0)}
                </td>
                <td className="px-4 py-2 text-slate-700">
                  {s.numero_decreto ? (
                    `Nº ${s.numero_decreto}`
                  ) : (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                      Aguardando número
                    </span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <MenuAcoes>
                    <DownloadPdfButton
                      variant="menu"
                      url={`/api/suplementacoes/${s.id}/ato/pdf`}
                      nomeArquivoPadrao={`ato-mesa-diretora-${s.id}.pdf`}
                      label="Baixar Ato"
                    />
                    {s.numero_decreto && (
                      <DownloadPdfButton
                        variant="menu"
                        url={`/api/suplementacoes/${s.id}/decreto/pdf`}
                        nomeArquivoPadrao={`decreto-suplementacao-${s.id}.pdf`}
                        label="Baixar Decreto"
                      />
                    )}
                    <Link
                      href={`/suplementacoes/${s.id}/editar`}
                      className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    >
                      Editar
                    </Link>
                    <ExcluirSolicitacaoButton
                      variant="menu"
                      action={excluirSuplementacao.bind(null, s.id)}
                      mensagemConfirmacao={`Tem certeza que deseja excluir a suplementação de ${formatarData(s.data_ato)}? Essa ação não pode ser desfeita.`}
                    />
                  </MenuAcoes>
                </td>
              </tr>
            ))}
            {suplementacoes?.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma suplementação cadastrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
