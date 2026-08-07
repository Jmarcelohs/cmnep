const ETAPAS = [
  { numero: 1, rotulo: "Relatório" },
  { numero: 2, rotulo: "Demonstrativo financeiro" },
  { numero: 3, rotulo: "Documentos" },
] as const;

export function EtapaProgresso({ atual }: { atual: 1 | 2 | 3 }) {
  return (
    <ol className="mb-6 flex items-center gap-2 text-sm">
      {ETAPAS.map((etapa, indice) => (
        <li key={etapa.numero} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              etapa.numero === atual
                ? "bg-brand-navy text-white"
                : etapa.numero < atual
                  ? "bg-brand-navy/15 text-brand-navy"
                  : "bg-slate-100 text-slate-400"
            }`}
          >
            {etapa.numero}
          </span>
          <span className={etapa.numero === atual ? "font-medium text-slate-900" : "text-slate-500"}>
            {etapa.rotulo}
          </span>
          {indice < ETAPAS.length - 1 && <span className="mx-1 h-px w-6 bg-slate-200" />}
        </li>
      ))}
    </ol>
  );
}
