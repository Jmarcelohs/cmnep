import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { buscarGlobal } from "@/lib/busca-global";
import { CampoBusca } from "@/components/campo-busca";

export default async function BuscaPage({
  searchParams,
}: {
  searchParams: Promise<{ busca?: string }>;
}) {
  const { busca } = await searchParams;
  const usuario = await getCurrentUsuario();
  const supabase = await createClient();

  const termo = (busca ?? "").trim();
  const resultado = await buscarGlobal(supabase, usuario, termo);

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Busca</h1>
      <p className="mt-1 text-sm text-slate-500">
        Procura em diárias, reembolsos, requerimentos internos, ofícios, pessoas, decretos e veículos
        ao mesmo tempo.
      </p>

      <form className="mt-4" action="/busca">
        <CampoBusca defaultValue={busca} placeholder="Buscar em todo o sistema..." />
        <button
          type="submit"
          className="mt-2 rounded-md bg-brand-navy px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-navy-light"
        >
          Buscar
        </button>
      </form>

      {termo.length > 0 && termo.length < 2 && (
        <p className="mt-6 text-sm text-slate-500">Digite pelo menos 2 caracteres.</p>
      )}

      {termo.length >= 2 && (
        <>
          <p className="mt-6 text-sm text-slate-500">
            {resultado.total} resultado(s) para &quot;{termo}&quot;.
          </p>

          <div className="mt-4 space-y-6">
            {resultado.grupos.map((grupo) => (
              <div key={grupo.titulo} className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-brand-navy">{grupo.titulo}</p>
                <ul className="mt-2 space-y-2 text-sm">
                  {grupo.itens.map((item) => (
                    <li key={item.id}>
                      <Link href={item.href} className="block hover:underline">
                        <span className="text-slate-900">{item.titulo}</span>
                        <span className="block text-xs text-slate-500">{item.subtitulo}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {resultado.total === 0 && (
              <p className="text-sm text-slate-400">Nenhum resultado encontrado.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
