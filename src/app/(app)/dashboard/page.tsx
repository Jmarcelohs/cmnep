import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { TIPO_LABEL } from "@/lib/requerimentos-internos/assuntos";
import { formatarData } from "@/lib/pdf/formato";
import type { StatusRequerimentoInterno, TipoRequerimentoInterno } from "@/lib/supabase/database.types";

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

  const porSolicitante = new Map<
    string,
    { total: number; autorizadas: number; valorAutorizado: number; ultimaSolicitacao: string | null }
  >();

  for (const s of lista) {
    const nome = (s.pessoas as unknown as { nome: string } | null)?.nome ?? "—";
    const atual = porSolicitante.get(nome) ?? {
      total: 0,
      autorizadas: 0,
      valorAutorizado: 0,
      ultimaSolicitacao: null,
    };
    atual.total += 1;
    if (s.status === "Autorizado") {
      atual.autorizadas += 1;
      atual.valorAutorizado += Number(s.total ?? 0);
    }
    if (!atual.ultimaSolicitacao || (s.data_solicitacao && s.data_solicitacao > atual.ultimaSolicitacao)) {
      atual.ultimaSolicitacao = s.data_solicitacao;
    }
    porSolicitante.set(nome, atual);
  }

  // Ordenado pela solicitação de diária mais recente de cada solicitante
  // (não pelo total de diárias) — quem pediu mais recentemente aparece
  // primeiro.
  const ranking = Array.from(porSolicitante.entries()).sort((a, b) => {
    const dataA = a[1].ultimaSolicitacao ?? "";
    const dataB = b[1].ultimaSolicitacao ?? "";
    return dataB.localeCompare(dataA);
  });

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
  const contagemTipoInterno: Record<TipoRequerimentoInterno, number> = { rh: 0, presidente: 0, geral: 0 };
  for (const r of listaInternos) {
    contagemStatusInterno[r.status as StatusRequerimentoInterno]++;
    contagemTipoInterno[r.tipo as TipoRequerimentoInterno]++;
  }
  const recentesInternos = listaInternos.slice(0, 6);
  const totalInternos = listaInternos.length;

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">
        Olá, {usuario?.nome ?? "usuário"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Perfil: {usuario?.papel ?? "—"}
      </p>

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

      <h2 className="mt-8 text-base font-semibold text-slate-900">Diárias por solicitante</h2>
      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Solicitante</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Última solicitação</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Total de diárias</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Autorizadas</th>
              <th className="px-4 py-2 text-left font-medium text-slate-500">Valor autorizado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ranking.map(([nome, dados]) => (
              <tr key={nome}>
                <td className="px-4 py-2 text-slate-900">{nome}</td>
                <td className="px-4 py-2 text-slate-700">{formatarData(dados.ultimaSolicitacao)}</td>
                <td className="px-4 py-2 text-slate-700">{dados.total}</td>
                <td className="px-4 py-2 text-slate-700">{dados.autorizadas}</td>
                <td className="px-4 py-2 text-slate-700">{formatarMoeda(dados.valorAutorizado)}</td>
              </tr>
            ))}
            {ranking.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
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

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Por categoria</p>
          <dl className="mt-2 space-y-2 text-sm">
            {(Object.keys(TIPO_LABEL) as TipoRequerimentoInterno[]).map((t) => {
              const pct = totalInternos > 0 ? Math.round((contagemTipoInterno[t] / totalInternos) * 100) : 0;
              return (
                <div key={t}>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">{TIPO_LABEL[t]}</dt>
                    <dd className="text-slate-900">{contagemTipoInterno[t]}</dd>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
                    <div className="h-1.5 rounded-full bg-brand-navy" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </dl>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
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
    </div>
  );
}
