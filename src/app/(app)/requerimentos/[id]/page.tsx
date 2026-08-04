import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { formatarData, formatarMoeda } from "@/lib/pdf/formato";
import { SUBASSUNTO_TITULO, corpoReembolso } from "@/lib/reembolso/documento";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { AnexosForm } from "../anexos-form";
import {
  excluirReembolso,
  marcarEmAnaliseReembolso,
  autorizarReembolso,
  naoAutorizarReembolso,
} from "../actions";
import type { StatusRequerimentoReembolso, SubassuntoReembolso } from "@/lib/supabase/database.types";

const STATUS_LABEL: Record<StatusRequerimentoReembolso, string> = {
  pendente: "Pendente",
  analise: "Em análise",
  deferido: "Deferido",
  indeferido: "Indeferido",
};

export default async function DetalheReembolsoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const usuario = await getCurrentUsuario();

  const { data: requerimento } = await supabase
    .from("requerimentos_reembolso")
    .select(
      "*, pessoas(nome, cargo), diarias_solicitacoes(numero_diaria, municipio_destino), veiculos_locacao_solicitacoes(numero, ano, veiculo_descricao)",
    )
    .eq("id", id)
    .single();

  if (!requerimento) notFound();

  const { data: minhaPessoa } = usuario
    ? await supabase.from("pessoas").select("id").eq("usuario_id", usuario.id).maybeSingle()
    : { data: null };

  const pessoa = requerimento.pessoas as unknown as { nome: string; cargo: string } | null;
  const diaria = requerimento.diarias_solicitacoes as unknown as {
    numero_diaria: string | null;
    municipio_destino: string | null;
  } | null;
  const veiculo = requerimento.veiculos_locacao_solicitacoes as unknown as {
    numero: string;
    ano: number;
    veiculo_descricao: string;
  } | null;

  const podeGerenciar =
    usuario?.papel === "admin" ||
    usuario?.papel === "gestor_diarias" ||
    minhaPessoa?.id === requerimento.pessoa_id;
  const podeDecidir =
    (usuario?.papel === "ordenador_despesa" ||
      usuario?.papel === "admin" ||
      usuario?.papel === "gestor_diarias") &&
    requerimento.status !== "deferido" &&
    requerimento.status !== "indeferido";

  const { data: anexos } = await supabase
    .from("requerimentos_reembolso_anexos")
    .select("id, nome_original, tipo, caminho")
    .eq("requerimento_id", id)
    .order("criado_em");

  const corpo = corpoReembolso({
    nome: pessoa?.nome ?? "",
    cargoDeclarado: requerimento.cargo_declarado,
    cpf: requerimento.cpf,
    subassunto: requerimento.subassunto as SubassuntoReembolso,
    dataIda: requerimento.data_ida,
    dataVolta: requerimento.data_volta,
    municipio: requerimento.municipio,
    valor: Number(requerimento.valor),
    placaVeiculo: requerimento.placa_veiculo,
    modeloVeiculo: requerimento.modelo_veiculo,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">
            Requerimento {requerimento.protocolo} — {pessoa?.nome ?? "—"}
          </h1>
          <p className="text-sm text-slate-500">
            {SUBASSUNTO_TITULO[requerimento.subassunto as SubassuntoReembolso]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {podeGerenciar && (
            <Link
              href={`/requerimentos/${id}/editar`}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Editar
            </Link>
          )}
          <DownloadPdfButton
            url={`/api/requerimentos/${id}/pdf`}
            nomeArquivoPadrao={`requerimento-${requerimento.protocolo.replace("/", "-")}.pdf`}
            label="Salvar PDF"
          />
          {podeGerenciar && (
            <ExcluirSolicitacaoButton
              action={excluirReembolso.bind(null, id)}
              size="md"
              mensagemConfirmacao={`Tem certeza que deseja excluir o requerimento ${requerimento.protocolo}? Essa ação não pode ser desfeita.`}
            />
          )}
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            {STATUS_LABEL[requerimento.status as StatusRequerimentoReembolso]}
          </span>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Cargo declarado</dt>
          <dd className="text-slate-900">{requerimento.cargo_declarado}</dd>
        </div>
        <div>
          <dt className="text-slate-500">CPF</dt>
          <dd className="text-slate-900">{requerimento.cpf ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Data do requerimento</dt>
          <dd className="text-slate-900">{formatarData(requerimento.data_requerimento)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Valor</dt>
          <dd className="text-slate-900">{formatarMoeda(requerimento.valor)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Período da viagem</dt>
          <dd className="text-slate-900">
            {formatarData(requerimento.data_ida)} a {formatarData(requerimento.data_volta)}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500">Município</dt>
          <dd className="text-slate-900">{requerimento.municipio}</dd>
        </div>
        {requerimento.subassunto === "combustivel" && (
          <>
            <div>
              <dt className="text-slate-500">Placa do veículo</dt>
              <dd className="text-slate-900">{requerimento.placa_veiculo ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Modelo do veículo</dt>
              <dd className="text-slate-900">{requerimento.modelo_veiculo ?? "—"}</dd>
            </div>
          </>
        )}
        {diaria && (
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Diária vinculada</dt>
            <dd className="text-slate-900">
              <Link
                href={`/diarias/${requerimento.solicitacao_diaria_id}/prestacao-contas`}
                className="hover:underline"
              >
                Diária {diaria.numero_diaria ?? "s/ nº"} — {diaria.municipio_destino ?? "—"}
              </Link>
              <span className="ml-2 text-xs text-slate-500">
                (entra automaticamente no PDF combinado da prestação de contas dessa diária)
              </span>
            </dd>
          </div>
        )}
        {veiculo && (
          <div className="sm:col-span-2">
            <dt className="text-slate-500">Locação de veículo vinculada</dt>
            <dd className="text-slate-900">
              <Link
                href={`/veiculos/${requerimento.solicitacao_veiculo_id}/editar`}
                className="hover:underline"
              >
                Locação {veiculo.numero}/{veiculo.ano} — {veiculo.veiculo_descricao}
              </Link>
            </dd>
          </div>
        )}
      </dl>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Corpo do requerimento</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{corpo}</p>
      </div>

      <AnexosForm requerimentoId={id} anexos={anexos ?? []} podeEditar={podeGerenciar} />

      {podeDecidir && (
        <div className="mt-6 flex flex-wrap gap-3">
          <form action={autorizarReembolso.bind(null, id)}>
            <button
              type="submit"
              className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Autorizar
            </button>
          </form>
          <form action={naoAutorizarReembolso.bind(null, id)}>
            <button
              type="submit"
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Não autorizar
            </button>
          </form>
          {requerimento.status !== "analise" && (
            <form action={marcarEmAnaliseReembolso.bind(null, id)}>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Marcar em análise
              </button>
            </form>
          )}
        </div>
      )}

      {requerimento.decisao_data && (
        <p className="mt-4 text-sm text-slate-500">
          Decisão em {formatarData(requerimento.decisao_data)}.
        </p>
      )}
    </div>
  );
}
