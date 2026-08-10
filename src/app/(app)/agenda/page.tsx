import Link from "next/link";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { listarEventos, type EventoAgenda } from "@/lib/agenda/google-calendar";
import { limitesDoMes, mesAtualBrasil, mesAdjacente, nomeMesAno } from "@/lib/agenda/mes";
import { formatarDiaCompleto, formatarHorario } from "@/lib/agenda/formato";
import { podeExcluirEvento } from "@/lib/agenda/permissoes";
import { MenuAcoes } from "@/components/menu-acoes";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { excluirEvento } from "./actions";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; error?: string }>;
}) {
  const { mes: mesParam, error: errorMsg } = await searchParams;
  const mes = mesParam || mesAtualBrasil();
  const usuario = await getCurrentUsuario();

  let eventos: EventoAgenda[] = [];
  let erroCarregar: string | null = null;
  try {
    eventos = await listarEventos(limitesDoMes(mes));
  } catch (err) {
    erroCarregar = err instanceof Error ? err.message : "Não foi possível carregar a agenda.";
  }

  const eventosPorDia = new Map<string, EventoAgenda[]>();
  for (const evento of eventos) {
    const dia = evento.inicio.slice(0, 10);
    if (!eventosPorDia.has(dia)) eventosPorDia.set(dia, []);
    eventosPorDia.get(dia)!.push(evento);
  }
  const dias = Array.from(eventosPorDia.keys()).sort();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Agenda</h1>
          <p className="mt-1 text-sm text-slate-500">
            Compromissos da Câmara Municipal de Nepomuceno.
          </p>
        </div>
        <Link
          href="/agenda/novo"
          className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
        >
          Novo compromisso
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-center gap-4">
        <Link
          href={`/agenda?mes=${mesAdjacente(mes, -1)}`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          ← Mês anterior
        </Link>
        <span className="text-sm font-medium capitalize text-slate-700">{nomeMesAno(mes)}</span>
        <Link
          href={`/agenda?mes=${mesAdjacente(mes, 1)}`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Mês seguinte →
        </Link>
      </div>

      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}
      {erroCarregar && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erroCarregar}</p>
      )}

      <div className="mt-6 space-y-6">
        {dias.map((dia) => (
          <div key={dia} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold capitalize text-brand-navy">
              {formatarDiaCompleto(dia)}
            </p>
            <ul className="mt-2 divide-y divide-slate-100">
              {eventosPorDia.get(dia)!.map((evento) => {
                const podeExcluir = usuario ? podeExcluirEvento(usuario, evento) : false;
                return (
                  <li
                    key={evento.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900">
                        {evento.diaTodo ? "Dia todo" : formatarHorario(evento.inicio)} —{" "}
                        {evento.titulo}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {evento.local && `${evento.local} · `}
                        {evento.criadoPorNome
                          ? `criado por ${evento.criadoPorNome}`
                          : "criado fora do sistema"}
                        {evento.descricao && ` — ${evento.descricao}`}
                      </p>
                    </div>
                    <MenuAcoes>
                      <Link
                        href={`/agenda/${encodeURIComponent(evento.id)}/editar`}
                        className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Editar
                      </Link>
                      {podeExcluir && (
                        <ExcluirSolicitacaoButton
                          variant="menu"
                          action={excluirEvento.bind(null, evento.id, evento.criadoPorUsuarioId, mes)}
                          mensagemConfirmacao={`Excluir "${evento.titulo}"? Essa ação não pode ser desfeita.`}
                        />
                      )}
                    </MenuAcoes>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        {dias.length === 0 && !erroCarregar && (
          <p className="py-6 text-center text-sm text-slate-400">
            Nenhum compromisso em {nomeMesAno(mes)}.
          </p>
        )}
      </div>
    </div>
  );
}
