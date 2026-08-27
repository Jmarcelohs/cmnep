import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { formatarData, formatarMoeda } from "@/lib/pdf/formato";
import { solicitarAtualizacaoOrcamento } from "./actions";

export default async function OrcamentoPage() {
  const usuario = await getCurrentUsuario();
  if (!usuario || !["admin", "ordenador_despesa"].includes(usuario.papel)) redirect("/dashboard");

  const supabase = await createClient();
  const { data: dotacoes } = await supabase
    .from("dotacoes_orcamentarias")
    .select(
      "id, ficha, elemento_nome, projeto_atividade_nome, dotacao_inicial_referencia, suplementado_referencia, empenhado_referencia, saldo_referencia, saldo_referencia_em",
    )
    .eq("ativo", true)
    .order("ficha", { ascending: true });

  const { data: ultimaSolicitacao } = await supabase
    .from("orcamento_solicitacoes_atualizacao")
    .select("solicitado_em")
    .order("solicitado_em", { ascending: false })
    .limit(1)
    .maybeSingle();

  const linhas = dotacoes ?? [];
  const totais = linhas.reduce(
    (soma, d) => ({
      dotacaoInicial: soma.dotacaoInicial + (d.dotacao_inicial_referencia ?? 0),
      suplementado: soma.suplementado + (d.suplementado_referencia ?? 0),
      empenhado: soma.empenhado + (d.empenhado_referencia ?? 0),
      saldo: soma.saldo + (d.saldo_referencia ?? 0),
    }),
    { dotacaoInicial: 0, suplementado: 0, empenhado: 0, saldo: 0 },
  );

  // A mais antiga entre as datas de atualização é a que manda — se
  // qualquer ficha ainda não foi atualizada nessa rodada, o painel como
  // um todo ainda está desatualizado.
  const datasAtualizacao = linhas.map((d) => d.saldo_referencia_em).filter((d): d is string => d !== null);
  const ultimaAtualizacaoGeral =
    datasAtualizacao.length === linhas.length && datasAtualizacao.length > 0
      ? datasAtualizacao.reduce((maisAntiga, atual) => (atual < maisAntiga ? atual : maisAntiga))
      : null;

  const pendente =
    ultimaSolicitacao &&
    (!ultimaAtualizacaoGeral || new Date(ultimaSolicitacao.solicitado_em) > new Date(`${ultimaAtualizacaoGeral}T23:59:59`));

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Painel de Orçamento</h1>
          <p className="mt-1 text-sm text-slate-500">
            Execução orçamentária por ficha — dotação inicial, suplementações, empenhado e saldo.
            Referência do sistema contábil (Betha), atualizada manualmente; quem manda de verdade é
            sempre o Betha, isso aqui só ajuda a acompanhar.
          </p>
        </div>
        {pendente ? (
          <span className="whitespace-nowrap rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
            Atualização solicitada
          </span>
        ) : (
          <form action={solicitarAtualizacaoOrcamento}>
            <button
              type="submit"
              className="whitespace-nowrap rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
            >
              Atualizar agora
            </button>
          </form>
        )}
      </div>

      <p className="mt-2 text-xs text-slate-400">
        {ultimaAtualizacaoGeral
          ? `Dados atualizados até ${formatarData(ultimaAtualizacaoGeral)}`
          : "Ainda sem atualização registrada pra todas as fichas."}
      </p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Ficha</th>
              <th className="px-4 py-2 text-right font-medium text-slate-600">Dotação Inicial</th>
              <th className="px-4 py-2 text-right font-medium text-slate-600">Suplementado</th>
              <th className="px-4 py-2 text-right font-medium text-slate-600">Empenhado</th>
              <th className="px-4 py-2 text-right font-medium text-slate-600">Saldo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {linhas.map((d) => (
              <tr key={d.id} className="hover:bg-slate-50">
                <td className="px-4 py-2">
                  <p className="font-medium text-slate-900">
                    {d.ficha} — {d.elemento_nome}
                  </p>
                  <p className="text-xs text-slate-500">{d.projeto_atividade_nome}</p>
                </td>
                <td className="px-4 py-2 text-right text-slate-700">
                  {formatarMoeda(d.dotacao_inicial_referencia ?? 0)}
                </td>
                <td className="px-4 py-2 text-right text-slate-700">
                  {formatarMoeda(d.suplementado_referencia ?? 0)}
                </td>
                <td className="px-4 py-2 text-right text-slate-700">
                  {formatarMoeda(d.empenhado_referencia ?? 0)}
                </td>
                <td className="px-4 py-2 text-right font-semibold text-slate-900">
                  {formatarMoeda(d.saldo_referencia ?? 0)}
                </td>
              </tr>
            ))}
            {linhas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma dotação cadastrada.
                </td>
              </tr>
            )}
          </tbody>
          {linhas.length > 0 && (
            <tfoot className="border-t-2 border-slate-300 font-semibold">
              <tr>
                <td className="px-4 py-2 text-slate-900">Total geral</td>
                <td className="px-4 py-2 text-right text-slate-900">{formatarMoeda(totais.dotacaoInicial)}</td>
                <td className="px-4 py-2 text-right text-slate-900">{formatarMoeda(totais.suplementado)}</td>
                <td className="px-4 py-2 text-right text-slate-900">{formatarMoeda(totais.empenhado)}</td>
                <td className="px-4 py-2 text-right text-slate-900">{formatarMoeda(totais.saldo)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
