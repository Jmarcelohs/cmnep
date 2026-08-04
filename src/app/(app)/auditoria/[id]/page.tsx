import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import {
  camposAlterados,
  OPERACAO_LABEL,
  OPERACAO_STYLES,
  TABELA_LABEL,
  tituloRegistro,
} from "@/lib/auditoria/formato";

export default async function DetalheAuditoriaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/dashboard");

  const supabase = await createClient();
  const { data: registro } = await supabase.from("auditoria").select("*").eq("id", id).single();

  if (!registro) notFound();

  const dadosAntigos = registro.dados_antigos as Record<string, unknown> | null;
  const dadosNovos = registro.dados_novos as Record<string, unknown> | null;
  const alteracoes = camposAlterados(dadosAntigos, dadosNovos);

  return (
    <div>
      <Link href="/auditoria" className="text-sm text-slate-500 hover:underline">
        ← Voltar ao histórico
      </Link>

      <div className="mt-2 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">
            {TABELA_LABEL[registro.tabela] ?? registro.tabela} —{" "}
            {tituloRegistro(dadosNovos, dadosAntigos)}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {new Date(registro.criado_em).toLocaleString("pt-BR")} · {registro.usuario_nome ?? "—"}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-sm font-medium ${OPERACAO_STYLES[registro.operacao] ?? ""}`}
        >
          {OPERACAO_LABEL[registro.operacao] ?? registro.operacao}
        </span>
      </div>

      {registro.operacao === "UPDATE" && (
        <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-brand-navy/5">
              <tr>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Campo</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Antes</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">Depois</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alteracoes.map((a) => (
                <tr key={a.campo}>
                  <td className="px-4 py-2 font-medium text-slate-700">{a.campo}</td>
                  <td className="px-4 py-2 text-slate-500">{a.de}</td>
                  <td className="px-4 py-2 text-slate-900">{a.para}</td>
                </tr>
              ))}
              {alteracoes.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                    Nenhum campo com mudança de valor (só metadados técnicos foram atualizados).
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {registro.operacao !== "UPDATE" && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">
            {registro.operacao === "INSERT" ? "Dados criados" : "Dados excluídos"}
          </p>
          <pre className="mt-2 overflow-x-auto whitespace-pre-wrap text-xs text-slate-700">
            {JSON.stringify(dadosNovos ?? dadosAntigos, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
