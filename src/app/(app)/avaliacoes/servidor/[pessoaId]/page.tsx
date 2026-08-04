import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PeriodoAvaliacao } from "@/lib/supabase/database.types";

const PERIODOS: { value: PeriodoAvaliacao; label: string }[] = [
  { value: "trimestre_1", label: "1º Trimestre" },
  { value: "trimestre_2", label: "2º Trimestre" },
  { value: "trimestre_3", label: "3º Trimestre" },
  { value: "anual", label: "Final" },
];

export default async function HistoricoServidorPage({
  params,
}: {
  params: Promise<{ pessoaId: string }>;
}) {
  const { pessoaId } = await params;
  const supabase = await createClient();

  const { data: pessoa } = await supabase
    .from("pessoas")
    .select("id, nome, matricula")
    .eq("id", pessoaId)
    .maybeSingle();

  if (!pessoa) notFound();

  // A ordenação por RLS já garante que só vemos o que temos permissão de ver
  // (admin vê tudo; o próprio servidor só vê as próprias avaliações).
  const { data: avaliacoes } = await supabase
    .from("avaliacoes")
    .select("id, ano, periodo, nota_final")
    .eq("pessoa_id", pessoaId)
    .order("ano")
    .order("periodo");

  const anos = Array.from(new Set((avaliacoes ?? []).map((a) => a.ano))).sort((a, b) => b - a);
  const porAnoPeriodo = new Map(
    (avaliacoes ?? []).map((a) => [`${a.ano}-${a.periodo}`, { id: a.id, nota: a.nota_final }]),
  );

  return (
    <div>
      <Link href="/avaliacoes" className="text-sm text-brand-navy hover:underline">
        ← Voltar
      </Link>
      <h1 className="mt-2 text-xl font-semibold text-brand-navy">
        Evolução — {pessoa.nome}
      </h1>
      <p className="text-sm text-slate-500">{pessoa.matricula ? `Matrícula ${pessoa.matricula}` : "—"}</p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Ano</th>
              {PERIODOS.map((p) => (
                <th key={p.value} className="px-4 py-2 text-left font-medium text-slate-600">
                  {p.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {anos.map((ano) => (
              <tr key={ano}>
                <td className="px-4 py-2 font-medium text-slate-900">{ano}</td>
                {PERIODOS.map((periodo) => {
                  const lancada = porAnoPeriodo.get(`${ano}-${periodo.value}`);
                  return (
                    <td key={periodo.value} className="px-4 py-2">
                      {lancada && lancada.nota != null ? (
                        <Link href={`/avaliacoes/${lancada.id}`} className="block hover:underline">
                          <span className="text-slate-700">{lancada.nota.toFixed(1)}</span>
                          <div className="mt-1 h-1.5 w-24 rounded-full bg-slate-100">
                            <div
                              className="h-1.5 rounded-full bg-brand-navy"
                              style={{ width: `${Math.min(100, Math.max(0, lancada.nota))}%` }}
                            />
                          </div>
                        </Link>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {anos.length === 0 && (
              <tr>
                <td colSpan={PERIODOS.length + 1} className="px-4 py-6 text-center text-slate-400">
                  Nenhuma avaliação lançada para {pessoa.nome} ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
