import { createClient } from "@/lib/supabase/server";
import { criarRequerimentoInterno } from "../actions";
import { RequerimentoInternoForm } from "../requerimento-form";

export default async function NovoRequerimentoInternoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();

  const [{ data: pessoas }, { data: sensiveis }] = await Promise.all([
    supabase.from("pessoas").select("id, nome, matricula, cargo, categoria").eq("ativo", true).order("nome"),
    supabase.from("pessoas_dados_sensiveis").select("pessoa_id, cpf"),
  ]);

  const cpfPorPessoa = new Map((sensiveis ?? []).map((s) => [s.pessoa_id, s.cpf]));
  const pessoasComCpf = (pessoas ?? []).map((p) => ({
    ...p,
    cpf: cpfPorPessoa.get(p.id) ?? null,
  }));

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Novo requerimento</h1>
      <p className="mt-1 text-sm text-slate-500">
        Endereçado ao Presidente da Câmara — o texto do requerimento é montado automaticamente.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <RequerimentoInternoForm action={criarRequerimentoInterno} pessoas={pessoasComCpf} />
    </div>
  );
}
