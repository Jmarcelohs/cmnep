import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LABEL_TIPO_MOCAO } from "@/lib/mocoes/documento";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import type { TipoMocao } from "@/lib/supabase/database.types";

export default async function LoteMocoesPage({
  params,
}: {
  params: Promise<{ loteId: string }>;
}) {
  const { loteId } = await params;
  const supabase = await createClient();

  const { data: mocoes } = await supabase
    .from("mocoes")
    .select("id, tipo, destinatario")
    .eq("lote_id", loteId)
    .order("destinatario");

  if (!mocoes || mocoes.length === 0) notFound();

  const tipo = mocoes[0].tipo as TipoMocao;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">
            Lote criado — {mocoes.length} {LABEL_TIPO_MOCAO[tipo]}
            {mocoes.length > 1 ? "ões" : ""}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Uma moção por homenageado — baixe todas juntas em ZIP ou individualmente abaixo.
          </p>
        </div>
        <DownloadPdfButton
          url={`/api/mocoes/lote/${loteId}/zip`}
          nomeArquivoPadrao={`mocoes-${loteId}.zip`}
          label="Baixar todas em ZIP"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Homenageado</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mocoes.map((m) => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-900">{m.destinatario}</td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-3">
                    <DownloadPdfButton
                      url={`/api/mocoes/${m.id}/pdf`}
                      nomeArquivoPadrao={`mocao-${m.id}.pdf`}
                    />
                    <Link
                      href={`/mocoes/${m.id}/editar`}
                      className="text-xs font-medium text-slate-600 hover:text-brand-navy"
                    >
                      Editar
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Link
        href="/mocoes"
        className="mt-6 inline-block text-sm font-medium text-brand-navy hover:underline"
      >
        Voltar pra lista de moções
      </Link>
    </div>
  );
}
