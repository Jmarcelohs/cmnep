import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import {
  criarPrestacaoContas,
  editarPrestacaoContas,
  enviarPrestacaoContas,
  aprovarPrestacaoOrdenador,
  darBaixaPagamento,
  emitirParecerControleInterno,
  excluirPrestacaoContas,
} from "../../prestacao-contas-actions";
import { AnexosForm } from "./anexos-form";
import { ComprovantesPagamentoForm } from "./comprovantes-pagamento-form";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { EtapaProgresso } from "./etapa-progresso";
import { EtapaRelatorioForm } from "./etapa-relatorio-form";
import { EtapaFinanceiroForm } from "./etapa-financeiro-form";
import { FinalizarRascunhoForm } from "./finalizar-rascunho-form";

function formatarMoeda(valor: number) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(data: string | null) {
  if (!data) return "—";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

const PARECER_LABEL: Record<string, string> = {
  aprovacao_sem_ressalvas: "Aprovação sem ressalvas",
  aprovacao_com_ressalvas: "Aprovação com ressalvas",
  reprovacao: "Reprovação",
};

export default async function PrestacaoContasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; etapa?: string }>;
}) {
  const { id } = await params;
  const { error: errorMsg, etapa: etapaParam } = await searchParams;
  const supabase = await createClient();
  const usuario = await getCurrentUsuario();

  const { data: solicitacao } = await supabase
    .from("diarias_solicitacoes")
    .select("id, status, total, pessoas(nome, cargo)")
    .eq("id", id)
    .single();

  if (!solicitacao) notFound();

  const pessoaSolicitacao = solicitacao.pessoas as unknown as {
    nome: string;
    cargo: string;
  } | null;

  const { data: minhaPessoa } = usuario
    ? await supabase.from("pessoas").select("id").eq("usuario_id", usuario.id).maybeSingle()
    : { data: null };

  const { data: prestacao } = await supabase
    .from("diarias_prestacoes_contas")
    .select("*, pessoas(nome, cargo)")
    .eq("solicitacao_id", id)
    .maybeSingle();

  const valorAutorizado = Number(solicitacao.total ?? 0);

  if (!prestacao) {
    const podeCriar =
      usuario?.papel === "admin" ||
      usuario?.papel === "gestor_diarias" ||
      Boolean(minhaPessoa?.id);
    // (checagem fina de dono é feita pela policy de RLS no insert)

    // Requerimentos de reembolso autorizados e vinculados a essa diária
    // entram automaticamente no demonstrativo financeiro — aéreo para
    // passagem aérea, urbano para locomoção/combustível/ônibus (só existem
    // essas duas linhas de transporte no Anexo II oficial).
    const { data: reembolsos } = await supabase
      .from("requerimentos_reembolso")
      .select("subassunto, valor")
      .eq("solicitacao_diaria_id", id)
      .eq("status", "deferido");

    const debitoTransporteAereo = (reembolsos ?? [])
      .filter((r) => r.subassunto === "passagem_aerea")
      .reduce((acc, r) => acc + Number(r.valor), 0);
    const debitoTransporteUrbano = (reembolsos ?? [])
      .filter((r) => r.subassunto !== "passagem_aerea")
      .reduce((acc, r) => acc + Number(r.valor), 0);

    if (solicitacao.status !== "Autorizado") {
      return (
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Prestação de contas</h1>
          <p className="mt-2 text-sm text-slate-500">
            Só é possível prestar contas de uma diária já autorizada. Status atual:{" "}
            {solicitacao.status}.
          </p>
        </div>
      );
    }

    if (!podeCriar) {
      return (
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Prestação de contas</h1>
          <p className="mt-2 text-sm text-slate-500">
            Você não tem permissão para prestar contas desta diária.
          </p>
        </div>
      );
    }

    return (
      <div>
        <h1 className="text-xl font-semibold text-brand-navy">
          Prestação de contas — {pessoaSolicitacao?.nome ?? "—"}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Anexo II da Resolução nº 040 de 04 de abril de 2023.
        </p>

        {errorMsg && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
        )}

        {(debitoTransporteAereo > 0 || debitoTransporteUrbano > 0) && (
          <p className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Valores de requerimentos de reembolso já autorizados para essa diária foram
            somados automaticamente nos campos de transporte abaixo — revise antes de enviar.
          </p>
        )}

        <EtapaProgresso atual={1} />
        <EtapaRelatorioForm
          action={criarPrestacaoContas.bind(null, id, "2")}
          valorAutorizado={valorAutorizado}
          valoresIniciaisFinanceiro={{
            debito_diarias_previstas: valorAutorizado,
            debito_diarias_nao_previstas: 0,
            debito_transporte_aereo: debitoTransporteAereo,
            debito_transporte_urbano: debitoTransporteUrbano,
            credito_recebidas_antecipadamente: 0,
            credito_reembolsar: 0,
            credito_transporte_urbano: 0,
            credito_devolver: 0,
          }}
        />
      </div>
    );
  }

  const pessoa = prestacao.pessoas as unknown as { nome: string; cargo: string } | null;

  const podeAnexar =
    usuario?.papel === "admin" ||
    usuario?.papel === "gestor_diarias" ||
    minhaPessoa?.id === prestacao.pessoa_id;

  // Enquanto não for enviada oficialmente (rascunho), ninguém do lado das
  // decisões (ordenador/tesoureiro/controle interno) pode agir — só existe
  // pra quem está preenchendo salvar o progresso.
  const souRascunho = !prestacao.data_autenticacao_beneficiario;

  const valoresFinanceiroSalvos = {
    debito_diarias_previstas: Number(prestacao.debito_diarias_previstas),
    debito_diarias_nao_previstas: Number(prestacao.debito_diarias_nao_previstas),
    debito_transporte_aereo: Number(prestacao.debito_transporte_aereo),
    debito_transporte_urbano: Number(prestacao.debito_transporte_urbano),
    credito_recebidas_antecipadamente: Number(prestacao.credito_recebidas_antecipadamente),
    credito_reembolsar: Number(prestacao.credito_reembolsar),
    credito_transporte_urbano: Number(prestacao.credito_transporte_urbano),
    credito_devolver: Number(prestacao.credito_devolver),
  };

  // Rascunho: fluxo por etapas sequenciais (relatório → financeiro →
  // documentos e salvar) — só quem pode gerenciar a prestação passa por
  // aqui; sem etapa na URL, sempre volta pra revisão da Etapa 1.
  if (souRascunho && podeAnexar) {
    const etapa = etapaParam === "2" ? 2 : etapaParam === "3" ? 3 : 1;

    if (etapa === 3) {
      const { data: anexos } = await supabase
        .from("diarias_prestacoes_anexos")
        .select("id, nome_original, tipo, caminho")
        .eq("prestacao_id", prestacao.id)
        .order("criado_em");

      return (
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">
            Prestação de contas — {pessoa?.nome ?? "—"}
          </h1>
          <p className="text-sm text-slate-500">{pessoa?.cargo}</p>
          {errorMsg && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
          )}
          <EtapaProgresso atual={3} />

          <AnexosForm prestacaoId={prestacao.id} anexos={anexos ?? []} podeEditar={podeAnexar} />

          <FinalizarRascunhoForm
            action={editarPrestacaoContas.bind(null, prestacao.id, id, null)}
            relatorioAtual={prestacao.relatorio_resultado ?? ""}
            valorAutorizado={valorAutorizado}
            valoresIniciaisFinanceiro={valoresFinanceiroSalvos}
          />

          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
            <Link href="?etapa=2" className="text-sm text-slate-500 hover:text-brand-navy">
              ← Voltar
            </Link>
            <ExcluirSolicitacaoButton
              action={excluirPrestacaoContas.bind(null, prestacao.id, id)}
              size="md"
              mensagemConfirmacao="Tem certeza que deseja excluir esse rascunho de prestação de contas? Essa ação não pode ser desfeita."
            />
          </div>
        </div>
      );
    }

    if (etapa === 2) {
      return (
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">
            Prestação de contas — {pessoa?.nome ?? "—"}
          </h1>
          <p className="text-sm text-slate-500">{pessoa?.cargo}</p>
          {errorMsg && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
          )}
          <EtapaProgresso atual={2} />
          <EtapaFinanceiroForm
            actionProximo={editarPrestacaoContas.bind(null, prestacao.id, id, "3")}
            actionVoltar={editarPrestacaoContas.bind(null, prestacao.id, id, "1")}
            valorAutorizado={valorAutorizado}
            valoresIniciais={valoresFinanceiroSalvos}
            relatorioAtual={prestacao.relatorio_resultado ?? ""}
          />
        </div>
      );
    }

    return (
      <div>
        <h1 className="text-xl font-semibold text-brand-navy">
          Prestação de contas — {pessoa?.nome ?? "—"}
        </h1>
        <p className="text-sm text-slate-500">{pessoa?.cargo}</p>
        {errorMsg && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
        )}
        <EtapaProgresso atual={1} />
        <EtapaRelatorioForm
          action={editarPrestacaoContas.bind(null, prestacao.id, id, "2")}
          valorInicial={prestacao.relatorio_resultado ?? ""}
          valorAutorizado={valorAutorizado}
          valoresIniciaisFinanceiro={valoresFinanceiroSalvos}
        />
      </div>
    );
  }

  const { data: pagamentos } = await supabase
    .from("diarias_prestacoes_pagamentos")
    .select("*")
    .eq("prestacao_id", prestacao.id);

  const idsPagamentos = (pagamentos ?? []).map((p) => p.id);
  const { data: comprovantesPagamentos } =
    idsPagamentos.length > 0
      ? await supabase
          .from("diarias_prestacoes_pagamentos_anexos")
          .select("id, pagamento_id, nome_original, tipo, caminho")
          .in("pagamento_id", idsPagamentos)
          .order("criado_em")
      : { data: [] };

  const { data: anexos } = await supabase
    .from("diarias_prestacoes_anexos")
    .select("id, nome_original, tipo, caminho")
    .eq("prestacao_id", prestacao.id)
    .order("criado_em");

  const { count: totalRequerimentos } = await supabase
    .from("requerimentos_reembolso")
    .select("id", { count: "exact", head: true })
    .eq("solicitacao_diaria_id", id);

  // Gestor de diárias tem acesso equivalente ao admin nesse módulo, mas não
  // pode aprovar/dar baixa/emitir parecer na própria prestação de contas —
  // aí o acesso elevado vira conflito de interesse e a decisão fica só com
  // quem tem o papel específico (ou admin).
  const souDono = minhaPessoa?.id === prestacao.pessoa_id;
  const gestorDiariasElevado = usuario?.papel === "gestor_diarias" && !souDono;

  const podeAprovarOrdenador =
    (usuario?.papel === "ordenador_despesa" || usuario?.papel === "admin" || gestorDiariasElevado) &&
    !souRascunho &&
    !prestacao.data_aprovacao_ordenador;
  const podeDarBaixa =
    (usuario?.papel === "tesoureiro" || usuario?.papel === "admin" || gestorDiariasElevado) && !souRascunho;
  const podeEmitirParecer =
    (usuario?.papel === "controle_interno" || usuario?.papel === "admin" || gestorDiariasElevado) &&
    !souRascunho &&
    !prestacao.parecer;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">
            Prestação de contas — {pessoa?.nome ?? "—"}
          </h1>
          <p className="text-sm text-slate-500">{pessoa?.cargo}</p>
        </div>
        <div className="flex items-center gap-3">
          {podeAnexar && (
            <Link
              href={`/diarias/${id}/prestacao-contas/editar`}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Editar
            </Link>
          )}
          {podeAnexar && souRascunho && (
            <form action={enviarPrestacaoContas.bind(null, prestacao.id, id)}>
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Enviar prestação de contas oficialmente
              </button>
            </form>
          )}
          <Link
            href={`/diarias/${id}/prestacao-contas/imprimir`}
            target="_blank"
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Imprimir (Anexo II)
          </Link>
          <Link
            href={`/diarias/${id}/prestacao-contas/imprimir-completo`}
            target="_blank"
            className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
          >
            {totalRequerimentos ? "Baixar Anexo I + II + Requerimento(s)" : "Baixar Anexo I + II"}
          </Link>
          {podeAnexar && (
            <ExcluirSolicitacaoButton
              action={excluirPrestacaoContas.bind(null, prestacao.id, id)}
              size="md"
              mensagemConfirmacao="Tem certeza que deseja excluir essa prestação de contas? Todos os anexos e pagamentos registrados também serão apagados. Essa ação não pode ser desfeita."
            />
          )}
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-500">Nº solicitação</dt>
          <dd className="text-slate-900">{prestacao.numero_solicitacao ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Fundamento legal</dt>
          <dd className="text-slate-900">{prestacao.fundamento_legal}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Data de partida</dt>
          <dd className="text-slate-900">{formatarData(prestacao.data_partida)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Data de chegada</dt>
          <dd className="text-slate-900">{formatarData(prestacao.data_chegada)}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-slate-500">Relatório do resultado da viagem</dt>
          <dd className="whitespace-pre-wrap text-slate-900">{prestacao.relatorio_resultado}</dd>
        </div>
      </dl>

      <h2 className="mt-6 text-base font-semibold text-slate-900">Demonstrativo financeiro</h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Débito</p>
          <dl className="mt-2 space-y-1">
            <div className="flex justify-between">
              <dt className="text-slate-500">Diárias previstas e realizadas</dt>
              <dd>{formatarMoeda(prestacao.debito_diarias_previstas)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Diárias não previstas, mas realizadas</dt>
              <dd>{formatarMoeda(prestacao.debito_diarias_nao_previstas)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Transporte aéreo</dt>
              <dd>{formatarMoeda(prestacao.debito_transporte_aereo)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Transporte urbano/pedágio/combustível</dt>
              <dd>{formatarMoeda(prestacao.debito_transporte_urbano)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold">
              <dt>Total do débito</dt>
              <dd>{formatarMoeda(prestacao.total_debito)}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Crédito</p>
          <dl className="mt-2 space-y-1">
            <div className="flex justify-between">
              <dt className="text-slate-500">Diárias recebidas antecipadamente</dt>
              <dd>{formatarMoeda(prestacao.credito_recebidas_antecipadamente)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Reembolsar diárias não recebidas</dt>
              <dd>{formatarMoeda(prestacao.credito_reembolsar)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Transporte urbano/pedágio/combustível</dt>
              <dd>{formatarMoeda(prestacao.credito_transporte_urbano)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Devolver diárias não realizadas</dt>
              <dd>{formatarMoeda(prestacao.credito_devolver)}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-1 font-semibold">
              <dt>Total do crédito</dt>
              <dd>{formatarMoeda(prestacao.total_credito)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {souRascunho ? (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
          Rascunho — ainda não enviado oficialmente. Ordenador, tesoureiro e Controle Interno só
          conseguem agir depois do envio.
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-600">
          Autenticado pelo beneficiário em {formatarData(prestacao.data_autenticacao_beneficiario)}.
        </p>
      )}

      <div className="mt-6">
        <AnexosForm prestacaoId={prestacao.id} anexos={anexos ?? []} podeEditar={podeAnexar} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Aprovação do ordenador da despesa</h3>
          {prestacao.data_aprovacao_ordenador ? (
            <p className="mt-2 text-sm text-slate-600">
              Aprovado por {prestacao.ordenador_despesa} em{" "}
              {formatarData(prestacao.data_aprovacao_ordenador)}.
            </p>
          ) : podeAprovarOrdenador ? (
            <form action={aprovarPrestacaoOrdenador.bind(null, prestacao.id, id)} className="mt-2">
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Aprovar prestação de contas
              </button>
            </form>
          ) : (
            <p className="mt-2 text-sm text-slate-400">
              {souRascunho
                ? "Aguardando envio da prestação de contas pelo solicitante."
                : "Aguardando aprovação do ordenador da despesa."}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-slate-900">Baixa do pagamento</h3>
          <ul className="mt-2 space-y-3 text-sm text-slate-700">
            {pagamentos?.map((p) => (
              <li key={p.id}>
                <p>
                  Nº {p.numero_processo} — {formatarMoeda(p.valor)}
                </p>
                <ComprovantesPagamentoForm
                  pagamentoId={p.id}
                  comprovantes={(comprovantesPagamentos ?? []).filter((c) => c.pagamento_id === p.id)}
                  podeEditar={podeDarBaixa}
                />
              </li>
            ))}
            {(!pagamentos || pagamentos.length === 0) && (
              <li className="text-slate-400">Nenhum pagamento registrado.</li>
            )}
          </ul>
          {podeDarBaixa && (
            <form
              action={darBaixaPagamento.bind(null, prestacao.id, id)}
              className="mt-3 flex flex-wrap items-end gap-2"
            >
              <div>
                <label htmlFor="baixa-numero-processo" className="block text-xs font-medium text-slate-500">Nº do processo</label>
                <input
                  id="baixa-numero-processo"
                  name="numero_processo"
                  className="mt-1 w-32 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label htmlFor="baixa-valor" className="block text-xs font-medium text-slate-500">Valor (R$)</label>
                <input
                  id="baixa-valor"
                  type="number"
                  step="0.01"
                  min={0}
                  name="valor"
                  className="mt-1 w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                />
              </div>
              <button
                type="submit"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Registrar
              </button>
            </form>
          )}
          {!podeDarBaixa && souRascunho && (
            <p className="mt-2 text-sm text-slate-400">
              Aguardando envio da prestação de contas pelo solicitante.
            </p>
          )}
          {prestacao.tesoureiro_nome && (
            <p className="mt-2 text-xs text-slate-500">Tesoureiro: {prestacao.tesoureiro_nome}</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold text-slate-900">Parecer conclusivo do Controle Interno</h3>
        {prestacao.parecer ? (
          <div className="mt-2 text-sm text-slate-700">
            <p className="font-medium">{PARECER_LABEL[prestacao.parecer] ?? prestacao.parecer}</p>
            {prestacao.parecer_observacao && (
              <p className="mt-1 text-slate-600">{prestacao.parecer_observacao}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">
              {prestacao.controle_interno_nome} — {prestacao.controle_interno_cargo}, em{" "}
              {formatarData(prestacao.parecer_data)}
            </p>
          </div>
        ) : podeEmitirParecer ? (
          <form action={emitirParecerControleInterno.bind(null, prestacao.id, id)} className="mt-3 space-y-3">
            <div className="space-y-1">
              {Object.entries(PARECER_LABEL).map(([valor, label]) => (
                <label key={valor} className="flex items-center gap-2 text-sm text-slate-700">
                  <input type="radio" name="parecer" value={valor} required />
                  {label}
                </label>
              ))}
            </div>
            <div>
              <label htmlFor="parecer_observacao" className="block text-xs font-medium text-slate-500">Observação</label>
              <textarea
                id="parecer_observacao"
                name="parecer_observacao"
                rows={2}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
            >
              Emitir parecer
            </button>
          </form>
        ) : (
          <p className="mt-2 text-sm text-slate-400">
            {souRascunho
              ? "Aguardando envio da prestação de contas pelo solicitante."
              : "Aguardando parecer do Controle Interno."}
          </p>
        )}
      </div>
    </div>
  );
}
