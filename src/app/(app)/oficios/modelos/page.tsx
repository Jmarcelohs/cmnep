import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { TIPO_OFICIO_LABEL } from "@/lib/oficios/documento";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { excluirModelo } from "../modelos-actions";

export default async function ModelosOficioPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorMsg } = await searchParams;
  const usuario = await getCurrentUsuario();
  const podeGerenciar = usuario?.papel === "admin" || usuario?.papel === "ordenador_despesa";

  const supabase = await createClient();
  const { data: modelos, error } = await supabase
    .from("oficios_modelos")
    .select("id, nome_modelo, tipo, assunto, criado_em")
    .order("nome_modelo");

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-brand-navy">Modelos de ofício</h1>
          <p className="mt-1 text-sm text-slate-500">
            Salvos a partir do formulário de ofício, pra reusar em ofícios recorrentes.
          </p>
        </div>
        <Link href="/oficios" className="text-sm font-medium text-brand-navy hover:underline">
          ← Voltar aos ofícios
        </Link>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Erro ao carregar modelos: {error.message}
        </p>
      )}
      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Nome do modelo</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Tipo</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Assunto</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Criado em</th>
              {podeGerenciar && (
                <th className="px-4 py-2 text-left font-medium text-slate-600">Ações</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {modelos?.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-2 text-slate-900">{m.nome_modelo}</td>
                <td className="px-4 py-2 text-slate-700">{TIPO_OFICIO_LABEL[m.tipo]}</td>
                <td className="px-4 py-2 text-slate-700">{m.assunto || "—"}</td>
                <td className="px-4 py-2 text-slate-700">
                  {new Date(m.criado_em).toLocaleDateString("pt-BR")}
                </td>
                {podeGerenciar && (
                  <td className="px-4 py-2">
                    <ExcluirSolicitacaoButton
                      action={excluirModelo.bind(null, m.id)}
                      mensagemConfirmacao={`Tem certeza que deseja excluir o modelo "${m.nome_modelo}"?`}
                    />
                  </td>
                )}
              </tr>
            ))}
            {modelos?.length === 0 && (
              <tr>
                <td colSpan={podeGerenciar ? 5 : 4} className="px-4 py-6 text-center text-slate-400">
                  Nenhum modelo salvo ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
