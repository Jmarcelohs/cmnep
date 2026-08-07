"use client";

import { useState } from "react";
import type { ValoresIniciaisPrestacao } from "./nova-prestacao-form";
import { CamposOcultosFinanceiro } from "./campos-ocultos-prestacao";

export function EtapaRelatorioForm({
  action,
  valorInicial = "",
  valorAutorizado,
  valoresIniciaisFinanceiro,
}: {
  action: (formData: FormData) => void;
  valorInicial?: string;
  valorAutorizado: number;
  valoresIniciaisFinanceiro?: Omit<ValoresIniciaisPrestacao, "relatorio_resultado">;
}) {
  const [relatorio, setRelatorio] = useState(valorInicial);
  const [enviando, setEnviando] = useState(false);

  return (
    <form action={action} onSubmit={() => setEnviando(true)} className="mt-6 space-y-6">
      <div>
        <label htmlFor="relatorio_resultado" className="block text-sm font-medium text-slate-700">
          Relatório do resultado da viagem — com ênfase no interesse público defendido
        </label>
        <textarea
          id="relatorio_resultado"
          name="relatorio_resultado"
          required
          rows={8}
          value={relatorio}
          onChange={(e) => setRelatorio(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <CamposOcultosFinanceiro valorAutorizado={valorAutorizado} valoresIniciais={valoresIniciaisFinanceiro} />

      <button
        type="submit"
        disabled={enviando}
        className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light disabled:opacity-60"
      >
        {enviando ? "Salvando…" : "Próximo →"}
      </button>
    </form>
  );
}
