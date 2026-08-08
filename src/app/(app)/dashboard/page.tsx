import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { formatarData } from "@/lib/pdf/formato";
import { calcularRankingSolicitantes } from "@/lib/dashboard/ranking";
import { buscarPendenciasPrestacaoContas } from "@/lib/dashboard/pendencias";
import { buscarDiariasAtrasadas } from "@/lib/dashboard/diarias-atrasadas";
import { buscarReembolsosParados, buscarRequerimentosInternosParados } from "@/lib/dashboard/requerimentos-parados";
import { buscarPessoasSemCpf } from "@/lib/dashboard/pessoas-sem-cpf";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { ListaPendencias } from "./lista-pendencias";
import { aprovarPrestacoesEmLote, emitirPareceresEmLote } from "../diarias/prestacao-contas-actions";
import type { StatusRequerimentoInterno } from "@/lib/supabase/database.types";

const STATUS_INTERNO_LABEL: Record<StatusRequerimentoInterno, string> = {
  pendente: "Pendente",
  analise: "Em análise",
  deferido: "Deferido",
  indeferido: "Indeferido",
};

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function DashboardPage() {
  const usuario = await getCurrentUsuario();
  const supabase = await createClient();

  const pendencias = await buscarPendenciasPrestacaoContas(supabase, usuario);
  const diariasAtrasadas = await buscarDiariasAtrasadas(supabase, usuario);
  const reembolsosParados = await buscarReembolsosParados(supabase, usuario);
  const internosParados = await buscarRequerimentosInternosParados(supabase, usuario);
  const pessoasSemCpf = await buscarPessoasSemCpf(supabase, usuario);

  const { data: solicitacoes } = await supabase
    .from("diarias_solicitacoes")
    .select(
      "id, status, total, municipio_destino, data_solicitacao, pessoas(nome), diarias_prestacoes_contas(id, parecer)",
    );

  const lista = solicitacoes ?? [];

  const autorizadasLista = lista.filter((s) => s.status === "Autorizado");
  const prestacaoPendente = autorizadasLista.filter((s) => {
    const prestacoes = s.diarias_prestacoes_contas as unknown as { parecer: string | null }[];
    return prestacoes.length === 0 || !prestacoes.some((p) => p.parecer);
  });
  const prestacaoConcluida = autorizadasLista.filter((s) => {
    const prestacoes = s.diarias_prestacoes_contas as unknown as { parecer: string | null }[];
    return prestacoes.some((p) => p.parecer);
  });

  const solicitadas = lista.filter((s) => s.status === "Solicitado").length;
  const autorizadas = lista.filter((s) => s.status === "Autorizado").length;
  const indeferidas = lista.filter((s) => s.status === "Indeferido").length;
  const valorAutorizado = lista
    .filter((s) => s.status === "Autorizado")
    .reduce((acc, s) => acc + Number(s.total ?? 0), 0);

  const ranking = await calcularRankingSolicitantes(supabase);

  const { data: requerimentosInternos } = await supabase
    .from("requerimentos_internos")
    .select("id, numero, ano, tipo, nome, assunto, status, criado_em")
    .order("criado_em", { ascending: false });

  const listaInternos = requerimentosInternos ?? [];
  const contagemStatusInterno: Record<StatusRequerimentoInterno, number> = {
    pendente: 0,
    analise: 0,
    deferido: 0,
    indeferido: 0,
  };
  for (const r of listaInternos) {
    contagemStatusInterno[r.status as StatusRequerimentoInterno]++;
  }
  const recentesInternos = listaInternos.slice(0, 6);

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">
        Olá, {usuario?.nome ?? "usuário"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Perfil: {usuario?.papel ?? "—"}
      </p>

      {pendencias.total > 0 && (
        <div className="mt-6">
          <h2 className="text-base font-semibold text-slate-900">
            Pendências para você ({pendencias.total})
          </h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(usuario?.papel === "ordenador_despesa" ||
              usuario?.papel === "admin" ||
              usuario?.papel === "gestor_diarias") && (
              <ListaPendencias
                titulo="Aguardando aprovação"
                itens={pendencias.aguardandoAprovacaoOrdenador}
                lote={{ tipo: "aprovacao", executar: aprovarPrestacoesEmLote }}
              />
            )}
            {(usuario?.papel === "tesoureiro" ||
              usuario?.papel === "admin" ||
              usuario?.papel === "gestor_diarias") && (
              <ListaPendencias
                titulo="Aguardando baixa de pagamento"
                itens={pendencias.aguardandoBaixaTesoureiro}
              />
            )}
            {(usuario?.papel === "controle_interno" ||
              usuario?.papel === "admin" ||
              usuario?.papel === "gestor_diarias") && (
              <ListaPendencias
                titulo="Aguardando parecer do Controle Interno"
                itens={pendencias.aguardandoParecerControleInterno}
                lote={{ tipo: "parecer", executar: emitirPareceresEmLote }}
              />
            )}
          </div>
        </div>
      )}

      {diariasAtrasadas.minhas.length > 0 && (
        <div className="mt-6">
          <ListaPendencias
            titulo="Sua prestação de contas está atrasada"
            itens={diariasAtrasadas.minhas.map((item) => ({
              prestacaoId: item.solicitacaoId,
              solicitacaoId: item.solicitacaoId,
              nome: `${item.nome} (${item.diasUteisAtraso} dias úteis)`,
            }))}
          />
        </div>
      )}

      {(usuario?.papel === "admin" || usuario?.papel === "gestor_diarias") &&
        diariasAtrasadas.deOutros.length > 0 && (
          <div className="mt-6">
            <ListaPendencias
              titulo="Prestações de contas atrasadas (equipe)"
              itens={diariasAtrasadas.deOutros.map((item) => ({
                prestacaoId: item.solicitacaoId,
                solicitacaoId: item.solicitacaoId,
                nome: `${item.nome} (${item.diasUteisAtraso} dias úteis)`,
              }))}
            />
          </div>
        )}

      {reembolsosParados.total > 0 && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-amber-700">
            Reembolsos parados sem decisão ({reembolsosParados.total})
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {reembolsosParados.itens.map((item) => (
              <li key={item.id}>
                <Link href={`/requerimentos/${item.id}`} className="text-slate-900 hover:underline">
                  {item.titulo} ({item.diasUteisParado} dias úteis)
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {internosParados.total > 0 && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-amber-700">
            Requerimentos internos parados sem decisão ({internosParados.total})
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {internosParados.itens.map((item) => (
              <li key={item.id}>
                <Link href={`/requerimentos-internos/${item.id}`} className="text-slate-900 hover:underline">
                  {item.titulo} ({item.diasUteisParado} dias úteis)
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(usuario?.papel === "admin" || usuario?.papel === "ordenador_despesa") &&
        pessoasSemCpf.total > 0 && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-amber-700">
              Pessoas sem CPF cadastrado ({pessoasSemCpf.total})
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {pessoasSemCpf.pessoas.map((p) => (
                <li key={p.id}>
                  <Link href={`/pessoas/${p.id}/editar`} className="text-slate-900 hover:underline">
                    {p.nome}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-200 border-t-4 border-t-amber-500 bg-white p-4">
          <p className="text-sm text-slate-500">Diárias pendentes de autorização</p>
          <p className="mt-2 text-2xl font-semibold text-amber-600">{solicitadas}</p>
        </div>
        <div className="rounded-lg border border-slate-200 border-t-4 border-t-emerald-500 bg-white p-4">
          <p className="text-sm text-slate-500">Diárias autorizadas</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{autorizadas}</p>
        </div>
        <div className="rounded-lg border border-slate-200 border-t-4 border-t-red-500 bg-white p-4">
          <p className="text-sm text-slate-500">Diárias indeferidas</p>
          <p className="mt-2 text-2xl font-semibold text-red-600">{indeferidas}</p>
        </div>
        <div className="rounded-lg border border-slate-200 border-t-4 border-t-brand-green bg-white p-4">
          <p className="text-sm text-slate-500">Valor total autorizado</p>
          <p className="mt-2 text-2xl font-semibold text-brand-navy">
            {formatarMoeda(valorAutorizado)}
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">Diárias por solicitante</h2>
        <div className="flex gap-2">
          <a
            href="/api/dashboard/ranking-csv"
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Exportar CSV
          </a>
          <DownloadPdfButton
            url="/api/dashboard/pdf"
            nomeArquivoPadrao="relatorio-painel.pdf"
            label="Exportar PDF"
          />
        </div>
      </div>
      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Solicitante</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Nº diária</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Nº solicitação</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Última solicitação</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Total de diárias</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Autorizadas</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Valor autorizado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ranking.map((dados) => (
              <tr key={dados.nome}>
                <td className="px-4 py-2 text-slate-900">{dados.nome}</td>
                <td className="px-4 py-2 text-slate-700">{dados.numeroDiaria ?? "—"}</td>
                <td className="px-4 py-2 text-slate-700">{dados.numeroSolicitacao ?? "—"}</td>
                <td className="px-4 py-2 text-slate-700">{formatarData(dados.ultimaSolicitacao)}</td>
                <td className="px-4 py-2 text-slate-700">{dados.total}</td>
                <td className="px-4 py-2 text-slate-700">{dados.autorizadas}</td>
                <td className="px-4 py-2 text-slate-700">{formatarMoeda(dados.valorAutorizado)}</td>
              </tr>
            ))}
            {ranking.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma solicitação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-base font-semibold text-slate-900">
        Diárias realizadas — prestação de contas
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-amber-700">
            Em aberto ({prestacaoPendente.length})
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            {prestacaoPendente.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/diarias/${s.id}/prestacao-contas`}
                  className="text-slate-900 hover:underline"
                >
                  {(s.pessoas as unknown as { nome: string } | null)?.nome ?? "—"}
                </Link>
                <span className="text-slate-500"> — {s.municipio_destino ?? "—"}</span>
              </li>
            ))}
            {prestacaoPendente.length === 0 && (
              <li className="text-slate-400">Nenhuma pendência.</li>
            )}
          </ul>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm font-medium text-emerald-700">
            Concluídas ({prestacaoConcluida.length})
          </p>
          <ul className="mt-2 space-y-2 text-sm">
            {prestacaoConcluida.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/diarias/${s.id}/prestacao-contas`}
                  className="text-slate-900 hover:underline"
                >
                  {(s.pessoas as unknown as { nome: string } | null)?.nome ?? "—"}
                </Link>
                <span className="text-slate-500"> — {s.municipio_destino ?? "—"}</span>
              </li>
            ))}
            {prestacaoConcluida.length === 0 && (
              <li className="text-slate-400">Nenhuma prestação concluída ainda.</li>
            )}
          </ul>
        </div>
      </div>

      <h2 className="mt-8 text-base font-semibold text-slate-900">Requerimentos Internos</h2>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {(Object.keys(STATUS_INTERNO_LABEL) as StatusRequerimentoInterno[]).map((s) => (
          <div key={s} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{STATUS_INTERNO_LABEL[s]}</p>
            <p className="mt-1 text-2xl font-semibold text-brand-navy">{contagemStatusInterno[s]}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Mais recentes</p>
        <ul className="mt-2 space-y-2 text-sm">
          {recentesInternos.map((r) => (
            <li key={r.id}>
              <Link href={`/requerimentos-internos/${r.id}`} className="text-slate-900 hover:underline">
                {r.numero}/{r.ano} — {r.nome}
              </Link>
              <span className="text-slate-500">
                {" "}
                — {r.assunto} ({formatarData(r.criado_em.slice(0, 10))})
              </span>
            </li>
          ))}
          {recentesInternos.length === 0 && (
            <li className="text-slate-400">Nenhum requerimento ainda.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
