import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { formatarData } from "@/lib/pdf/formato";
import {
  MODALIDADES_PROCESSO,
  rotuloNumeroModalidade,
  rotuloNumeroProcesso,
} from "@/lib/licitacoes/tipos";
import { buscarProcesso, listarDocumentos, listarItens, listarPessoasAtivas } from "../actions";
import { ProcessoDetalhe } from "./processo-detalhe";
import { ItensEditor } from "./itens-editor";

export default async function ProcessoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await getCurrentUsuario();
  if (!usuario || !["admin", "ordenador_despesa", "servidor"].includes(usuario.papel)) {
    redirect("/dashboard");
  }

  const [processo, documentos, pessoas, itens] = await Promise.all([
    buscarProcesso(id),
    listarDocumentos(id),
    listarPessoasAtivas(),
    listarItens(id),
  ]);
  if (!processo) notFound();

  const organizador = pessoas.find((p) => p.id === processo.organizadorPessoaId) ?? null;
  const agente = pessoas.find((p) => p.id === processo.agenteContratacaoPessoaId) ?? null;
  const pesquisaPrecos = pessoas.find((p) => p.id === processo.pesquisaPrecosPessoaId) ?? null;
  const gestor = pessoas.find((p) => p.id === processo.gestorContratoPessoaId) ?? null;
  const fiscal = pessoas.find((p) => p.id === processo.fiscalContratoPessoaId) ?? null;

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">
            Processo Nº {rotuloNumeroProcesso(processo)}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {MODALIDADES_PROCESSO.find((m) => m.valor === processo.modalidade)?.label} — Nº{" "}
            {rotuloNumeroModalidade(processo)} — abertura em {formatarData(processo.dataAbertura)}
          </p>
        </div>
        <Link
          href={`/licitacoes/${id}/editar`}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Editar processo
        </Link>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="font-medium text-slate-500">Objeto</dt>
            <dd className="mt-1 text-slate-900">{processo.objeto}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Ficha orçamentária</dt>
            <dd className="mt-1 text-slate-900">
              {processo.ficha ? `Ficha ${processo.ficha.ficha}` : "—"}
              {processo.dotacaoSubelemento && ` — ${processo.dotacaoSubelemento}`}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Vínculo no PCA</dt>
            <dd className="mt-1 text-slate-900">{processo.vinculoPca || "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Quem organizou / Agente de contratação</dt>
            <dd className="mt-1 text-slate-900">
              {organizador?.nome ?? "—"} / {agente?.nome ?? "—"}
            </dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Pesquisa de preços</dt>
            <dd className="mt-1 text-slate-900">{pesquisaPrecos?.nome ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-500">Gestor / Fiscal do contrato</dt>
            <dd className="mt-1 text-slate-900">
              {gestor?.nome ?? "—"} / {fiscal?.nome ?? "—"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <ItensEditor processoId={id} itensIniciais={itens} />
      </div>

      <div className="mt-6">
        <ProcessoDetalhe
          processoId={id}
          documentos={documentos}
          camposTr={{
            trSolucaoEscolhida: processo.trSolucaoEscolhida,
            trNaturezaExecucao: processo.trNaturezaExecucao,
            trJustificativaNatureza: processo.trJustificativaNatureza,
          }}
        />
      </div>
    </div>
  );
}
