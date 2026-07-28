import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { formatarData } from "@/lib/pdf/formato";
import { calcularResumo } from "@/lib/avaliacoes/calculo";
import { getTemplate } from "@/lib/avaliacoes/templates";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { excluirAvaliacao } from "../actions";

const PERIODO_LABEL: Record<string, string> = {
  trimestre_1: "1º Trimestre",
  trimestre_2: "2º Trimestre",
  trimestre_3: "3º Trimestre",
  anual: "Anual (Final)",
};

export default async function DetalheAvaliacaoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const usuario = await getCurrentUsuario();

  const { data: avaliacao } = await supabase
    .from("avaliacoes")
    .select("*, pessoas(nome, matricula)")
    .eq("id", id)
    .single();

  if (!avaliacao) notFound();

  const template = getTemplate(avaliacao.template);
  const resumo = calcularResumo(avaliacao.itens, template);
  const podeGerenciar = usuario?.papel === "admin";
  const pessoa = avaliacao.pessoas as unknown as { nome: string; matricula: string | null } | null;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">
            {pessoa?.nome ?? "Servidor(a)"} — {PERIODO_LABEL[avaliacao.periodo]}/{avaliacao.ano}
          </h1>
          <p className="text-sm text-slate-500">{template.nome}</p>
        </div>
        <div className="flex items-center gap-3">
          {podeGerenciar && (
            <Link
              href={`/avaliacoes/${id}/editar`}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Editar
            </Link>
          )}
          <DownloadPdfButton
            url={`/api/avaliacoes/${id}/pdf`}
            nomeArquivoPadrao={`avaliacao-${pessoa?.nome ?? id}-${avaliacao.periodo}-${avaliacao.ano}.pdf`}
            label="Salvar PDF"
          />
          {podeGerenciar && (
            <ExcluirSolicitacaoButton
              action={excluirAvaliacao.bind(null, id)}
              size="md"
              mensagemConfirmacao="Tem certeza que deseja excluir essa avaliação? Essa ação não pode ser desfeita."
            />
          )}
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Matrícula</dt>
          <dd className="text-slate-900">{pessoa?.matricula ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Data da avaliação</dt>
          <dd className="text-slate-900">{formatarData(avaliacao.data_avaliacao)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-500">Avaliadores</dt>
          <dd className="text-slate-900">
            {avaliacao.avaliadores.map((a) => a.nome).join(", ") || "—"}
          </dd>
        </div>
      </dl>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Quantidade de conceitos obtidos</p>
        <table className="mt-2 min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-2 py-1 text-left font-medium text-slate-500">Critério</th>
              {template.conceitos.map((c) => (
                <th key={c.key} className="px-2 py-1 text-center font-medium text-slate-500">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {template.criterios.map((criterio) => (
              <tr key={criterio.key}>
                <td className="px-2 py-1 text-slate-700">
                  {criterio.key} - {criterio.nome}
                </td>
                {template.conceitos.map((c) => (
                  <td key={c.key} className="px-2 py-1 text-center text-slate-700">
                    {resumo.porCriterio[criterio.key]?.[c.key] ?? 0}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="px-2 py-1 text-slate-900">Total dos Conceitos</td>
              {template.conceitos.map((c) => (
                <td key={c.key} className="px-2 py-1 text-center text-slate-900">
                  {resumo.totalPorConceito[c.key]}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <p className="mt-3 text-lg font-semibold text-brand-navy">Nota final: {resumo.notaFinal.toFixed(2)} / 100</p>
      </div>

      {(avaliacao.pontos_positivos || avaliacao.pontos_melhorar) && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {avaliacao.pontos_positivos && (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Pontos positivos</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{avaliacao.pontos_positivos}</p>
            </div>
          )}
          {avaliacao.pontos_melhorar && (
            <div className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold uppercase text-slate-500">Pontos a serem melhorados</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{avaliacao.pontos_melhorar}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
