import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { createClient } from "@/lib/supabase/server";
import { listarSolicitacoesPlenario, type SolicitacaoPlenario } from "@/lib/plenario/google-sheets";
import { formatarData } from "@/lib/pdf/formato";
import { MenuAcoes } from "@/components/menu-acoes";
import { aprovarSolicitacaoPlenario, recusarSolicitacaoPlenario } from "./actions";
import type { StatusSessaoPlenario } from "@/lib/supabase/database.types";

const STATUS_LABEL: Record<StatusSessaoPlenario, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  recusado: "Recusado",
};

const STATUS_STYLES: Record<StatusSessaoPlenario, string> = {
  pendente: "bg-amber-50 text-amber-700",
  aprovado: "bg-emerald-50 text-emerald-700",
  recusado: "bg-red-50 text-red-700",
};

type Aba = "pendentes" | "aprovadas" | "recusadas" | "todas";

export default async function PlenarioPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; error?: string }>;
}) {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin" && usuario?.papel !== "ordenador_despesa") redirect("/dashboard");

  const { aba: abaParam, error: errorMsg } = await searchParams;
  const aba: Aba =
    abaParam === "aprovadas" || abaParam === "recusadas" || abaParam === "todas"
      ? abaParam
      : "pendentes";

  let solicitacoes: SolicitacaoPlenario[] = [];
  let erroCarregar: string | null = null;
  try {
    solicitacoes = await listarSolicitacoesPlenario();
  } catch (err) {
    erroCarregar =
      err instanceof Error ? err.message : "Não foi possível carregar as solicitações.";
  }

  const supabase = await createClient();
  const { data: decisoes } = await supabase
    .from("sessoes_plenario_decisoes")
    .select("resposta_timestamp, status, decidido_em");
  const decisaoPorTimestamp = new Map(
    (decisoes ?? []).map((d) => [d.resposta_timestamp, d]),
  );

  const linhas = solicitacoes
    .map((s) => ({
      solicitacao: s,
      status: decisaoPorTimestamp.get(s.respostaTimestamp)?.status ?? "pendente",
    }))
    .filter((l) => {
      if (aba === "todas") return true;
      if (aba === "pendentes") return l.status === "pendente";
      if (aba === "aprovadas") return l.status === "aprovado";
      return l.status === "recusado";
    })
    // Mais recente primeiro dentro de cada aba, pela data desejada do uso.
    .sort((a, b) => b.solicitacao.dataDesejada.localeCompare(a.solicitacao.dataDesejada));

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Sessão do Plenário</h1>
      <p className="mt-1 text-sm text-slate-500">
        Solicitações de uso/empréstimo do Plenário e seus equipamentos, recebidas pelo{" "}
        <a
          href="https://docs.google.com/forms/d/1QJt5cNsPaUD_7aFB2yfBVaHm7VA6zpHY5M-yrR1oj28/edit"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-brand-navy"
        >
          formulário de solicitação
        </a>
        . Aprovar cria automaticamente o compromisso na Agenda.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {(
          [
            ["pendentes", "Pendentes"],
            ["aprovadas", "Aprovadas"],
            ["recusadas", "Recusadas"],
            ["todas", "Todas"],
          ] as [Aba, string][]
        ).map(([valor, rotulo]) => (
          <Link
            key={valor}
            href={`/plenario?aba=${valor}`}
            className={`rounded-full px-3 py-1 ${aba === valor ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-600"}`}
          >
            {rotulo}
          </Link>
        ))}
      </div>

      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}
      {erroCarregar && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erroCarregar}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Nº</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Data desejada</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Solicitante</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Finalidade</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Tipo</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {linhas.map(({ solicitacao: s, status }) => (
              <tr key={s.respostaTimestamp} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-700">{s.numeroRequerimento || "—"}</td>
                <td className="px-4 py-2 text-slate-900">
                  {s.dataDesejada && formatarData(s.dataDesejada)}
                  <br />
                  <span className="text-xs text-slate-500">
                    {s.horaInicio.slice(0, 5)}–{s.horaFim.slice(0, 5)}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-700">
                  {s.nomeSolicitante}
                  {s.instituicao && <div className="text-xs text-slate-500">{s.instituicao}</div>}
                </td>
                <td className="px-4 py-2 text-slate-700">{s.finalidade}</td>
                <td className="px-4 py-2 text-slate-700">{s.tipoEvento}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[status as StatusSessaoPlenario]}`}
                  >
                    {STATUS_LABEL[status as StatusSessaoPlenario]}
                  </span>
                </td>
                <td className="px-4 py-2">
                  {status === "pendente" ? (
                    <MenuAcoes>
                      <form action={aprovarSolicitacaoPlenario.bind(null, s.respostaTimestamp)}>
                        <button
                          type="submit"
                          className="block w-full px-3 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50"
                        >
                          Aprovar
                        </button>
                      </form>
                      <form action={recusarSolicitacaoPlenario.bind(null, s.respostaTimestamp)}>
                        <button
                          type="submit"
                          className="block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                        >
                          Recusar
                        </button>
                      </form>
                    </MenuAcoes>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                </td>
              </tr>
            ))}
            {linhas.length === 0 && !erroCarregar && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma solicitação {aba === "todas" ? "" : STATUS_LABEL[
                    aba === "pendentes" ? "pendente" : aba === "aprovadas" ? "aprovado" : "recusado"
                  ].toLowerCase()}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
