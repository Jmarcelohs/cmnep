import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { rotuloFicha } from "@/lib/suplementacoes/documento";
import { buscarSuplementacaoCompleta } from "@/lib/suplementacoes/dados";
import { editarSuplementacao } from "../../actions";
import { SuplementacaoForm } from "../../suplementacao-form";
import { DownloadPdfButton } from "@/components/download-pdf-button";

export default async function EditarSuplementacaoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; salvo?: string }>;
}) {
  const { id } = await params;
  const { error, salvo } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const [dados, { data: dotacoes }] = await Promise.all([
    buscarSuplementacaoCompleta(supabase, id),
    supabase.from("dotacoes_orcamentarias").select("*").eq("ativo", true).order("ficha"),
  ]);

  if (!dados) notFound();
  const { suplementacao, itensDestino, itensOrigem } = dados;

  const fichas = (dotacoes ?? []).map((d) => ({
    id: d.id,
    ficha: d.ficha,
    rotulo: rotuloFicha(d),
    dotacao: d,
  }));

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-brand-navy">
          Editar suplementação — {suplementacao.data_ato}
        </h1>
        <div className="flex gap-2">
          <DownloadPdfButton
            url={`/api/suplementacoes/${id}/ato/pdf`}
            nomeArquivoPadrao={`ato-mesa-diretora-${id}.pdf`}
            label="Baixar Ato"
          />
          <DownloadPdfButton
            url={`/api/suplementacoes/${id}/decreto/pdf`}
            nomeArquivoPadrao={`decreto-suplementacao-${id}.pdf`}
            label="Baixar Decreto"
          />
        </div>
      </div>

      {!suplementacao.numero_decreto && (
        <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Sem número de Decreto ainda — o PDF do Decreto sai com &quot;___&quot; no lugar do número até você
          preencher abaixo.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}
      {salvo && (
        <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          Alterações salvas.
        </p>
      )}

      <SuplementacaoForm
        action={editarSuplementacao.bind(null, id)}
        fichas={fichas}
        submitLabel="Salvar alterações"
        valoresIniciais={{
          data_ato: suplementacao.data_ato,
          numero_decreto: suplementacao.numero_decreto ?? "",
          data_decreto: suplementacao.data_decreto ?? suplementacao.data_ato,
          corpo_ato_html: suplementacao.corpo_ato_html ?? "",
          corpo_decreto_html: suplementacao.corpo_decreto_html ?? "",
          itensDestino: itensDestino.map((i) => ({ fichaId: i.dotacao.id, valor: String(i.valor) })),
          itensOrigem: itensOrigem.map((i) => ({ fichaId: i.dotacao.id, valor: String(i.valor) })),
        }}
      />

      <Link
        href="/suplementacoes"
        className="mt-6 inline-block text-sm font-medium text-brand-navy hover:underline"
      >
        Voltar pra lista
      </Link>
    </div>
  );
}
