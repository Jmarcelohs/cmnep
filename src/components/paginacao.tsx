import Link from "next/link";

export function Paginacao({
  pagina,
  totalPaginas,
  count,
  baseHref,
  paramsBase,
}: {
  pagina: number;
  totalPaginas: number;
  count: number | null;
  baseHref: string;
  paramsBase: URLSearchParams;
}) {
  if (totalPaginas <= 1) return null;

  const prefixo = paramsBase.toString() ? `${paramsBase.toString()}&` : "";

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <p className="text-slate-500">
        Página {pagina} de {totalPaginas} ({count} registros)
      </p>
      <div className="flex gap-2">
        {pagina > 1 && (
          <Link
            href={`${baseHref}?${prefixo}pagina=${pagina - 1}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Anterior
          </Link>
        )}
        {pagina < totalPaginas && (
          <Link
            href={`${baseHref}?${prefixo}pagina=${pagina + 1}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50"
          >
            Próxima
          </Link>
        )}
      </div>
    </div>
  );
}
