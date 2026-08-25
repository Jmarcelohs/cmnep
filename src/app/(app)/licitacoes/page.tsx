import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { formatarData } from "@/lib/pdf/formato";
import { MODALIDADES_PROCESSO, rotuloNumeroModalidade, rotuloNumeroProcesso } from "@/lib/licitacoes/tipos";
import { listarProcessos } from "./actions";

export default async function LicitacoesPage() {
  const usuario = await getCurrentUsuario();
  if (!usuario || !["admin", "ordenador_despesa", "servidor"].includes(usuario.papel)) {
    redirect("/dashboard");
  }

  const processos = await listarProcessos();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Licitações</h1>
          <p className="mt-1 text-sm text-slate-500">
            Processos de contratação (dispensa, inexigibilidade, pregão) e os documentos que os compõem.
          </p>
        </div>
        <Link
          href="/licitacoes/novo"
          className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
        >
          + Novo processo
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Procedimento</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Modalidade</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Objeto</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Abertura</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Ficha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {processos.map((p) => (
              <tr key={p.id} className="cursor-pointer hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-900">
                  <Link href={`/licitacoes/${p.id}`} className="block font-medium text-brand-navy hover:underline">
                    Nº {rotuloNumeroProcesso(p)}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-700">
                  {MODALIDADES_PROCESSO.find((m) => m.valor === p.modalidade)?.label} — Nº{" "}
                  {rotuloNumeroModalidade(p)}
                </td>
                <td className="max-w-md truncate px-4 py-2 text-slate-700">{p.objeto}</td>
                <td className="px-4 py-2 text-slate-700">{formatarData(p.dataAbertura)}</td>
                <td className="px-4 py-2 text-slate-700">
                  {p.ficha ? `Ficha ${p.ficha.ficha}` : "—"}
                </td>
              </tr>
            ))}
            {processos.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  Nenhum processo cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
