import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { editarPessoa } from "../../actions";
import { PessoaForm } from "../../pessoa-form";

export default async function EditarPessoaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorMsg } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/pessoas");

  const supabase = await createClient();
  const { data: pessoa } = await supabase
    .from("pessoas")
    .select("id, matricula, nome, cargo, categoria, partido, genero")
    .eq("id", id)
    .single();

  if (!pessoa) notFound();

  const { data: sensivel } = await supabase
    .from("pessoas_dados_sensiveis")
    .select("cpf")
    .eq("pessoa_id", id)
    .maybeSingle();

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Editar pessoa</h1>
      <p className="mt-1 text-sm text-slate-500">{pessoa.nome}</p>

      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{errorMsg}</p>
      )}

      <PessoaForm
        action={editarPessoa.bind(null, id)}
        submitLabel="Salvar alterações"
        valoresIniciais={{
          matricula: pessoa.matricula ?? "",
          nome: pessoa.nome,
          cargo: pessoa.cargo,
          categoria: pessoa.categoria,
          partido: pessoa.partido ?? "",
          cpf: sensivel?.cpf ?? "",
          genero: pessoa.genero ?? "",
        }}
      />
    </div>
  );
}
