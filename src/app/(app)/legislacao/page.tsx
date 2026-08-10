import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { construirFiltroBusca } from "@/lib/busca";
import { DocumentosLegislacao } from "./documentos-form";

export default async function LegislacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>;
}) {
  const { busca } = await searchParams;
  const supabase = await createClient();
  const usuario = await getCurrentUsuario();
  const podeGerenciar = usuario?.papel === "admin" || usuario?.papel === "ordenador_despesa";

  let query = supabase
    .from("legislacao_documentos")
    .select("id, titulo, tipo, numero, ano, descricao, caminho, nome_original, criado_em")
    .order("criado_em", { ascending: false });

  if (busca?.trim()) {
    query = query.or(
      construirFiltroBusca(busca.trim(), ["titulo", "descricao", "numero", "conteudo_texto"]),
    );
  }

  const { data: documentos } = await query;

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Legislação Municipal</h1>
      <p className="mt-1 text-sm text-slate-500">
        Leis, decretos, resoluções e a Lei Orgânica de Nepomuceno, mantidos pelo{" "}
        <a
          href="https://leis.org/camara/mg/nepomuceno"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-brand-navy"
        >
          leis.org
        </a>
        .
      </p>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <form
          action="/api/legislacao/pesquisar"
          method="get"
          target="_blank"
          className="flex flex-wrap items-end gap-3"
        >
          <div className="flex-1 min-w-[240px]">
            <label htmlFor="termo" className="block text-xs font-medium text-slate-500">
              Pesquisar por termo (ex.: &quot;poda de árvores&quot;, &quot;estágio&quot;, número de lei)
            </label>
            <input
              id="termo"
              name="termo"
              type="text"
              placeholder="Digite um termo, assunto ou número"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
          >
            Pesquisar
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          Abre em uma nova aba, buscando dentro do acervo de legislação de Nepomuceno.
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-700">
          Prefere navegar pelo acervo completo (leis, decretos, resoluções, Lei Orgânica, Código
          Tributário e outros) em vez de pesquisar por um termo?
        </p>
        <a
          href="https://leis.org/camara/mg/nepomuceno"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Abrir o acervo completo ↗
        </a>
      </div>

      <DocumentosLegislacao documentos={documentos ?? []} podeGerenciar={podeGerenciar} busca={busca} />

      <p className="mt-4 text-xs text-slate-400">
        Conteúdo mantido por terceiros (leis.org), fora deste sistema — em caso de divergência,
        o texto oficial publicado pela Câmara prevalece.
      </p>
    </div>
  );
}
