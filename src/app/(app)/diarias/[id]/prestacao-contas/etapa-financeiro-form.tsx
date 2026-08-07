"use client";

import { useState } from "react";
import { CampoNumero } from "./campo-numero";
import type { ValoresIniciaisPrestacao } from "./nova-prestacao-form";
import { CampoOcultoRelatorio } from "./campos-ocultos-prestacao";

export function EtapaFinanceiroForm({
  actionProximo,
  actionVoltar,
  valorAutorizado,
  valoresIniciais,
  relatorioAtual,
}: {
  actionProximo: (formData: FormData) => void;
  actionVoltar: (formData: FormData) => void;
  valorAutorizado: number;
  valoresIniciais?: Omit<ValoresIniciaisPrestacao, "relatorio_resultado">;
  // A action de criar/editar sempre lê relatorio_resultado do formData —
  // essa etapa não mostra o campo, então precisa carregá-lo escondido pra
  // não apagar o que foi salvo na Etapa 1.
  relatorioAtual: string;
}) {
  const [enviando, setEnviando] = useState(false);

  return (
    <form action={actionProximo} onSubmit={() => setEnviando(true)} className="mt-6 space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-slate-700">Demonstrativo financeiro</h2>
        <div className="mt-3 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Débito — valores realizados
            </p>
            <CampoNumero
              name="debito_diarias_previstas"
              label="Diárias previstas e realizadas"
              defaultValue={valoresIniciais?.debito_diarias_previstas ?? valorAutorizado}
            />
            <CampoNumero
              name="debito_diarias_nao_previstas"
              label="Diárias não previstas, mas realizadas"
              defaultValue={valoresIniciais?.debito_diarias_nao_previstas}
            />
            <CampoNumero
              name="debito_transporte_aereo"
              label="Despesas com transporte aéreo"
              defaultValue={valoresIniciais?.debito_transporte_aereo}
            />
            <CampoNumero
              name="debito_transporte_urbano"
              label="Despesas com transporte urbano, pedágio, combustível e estacionamento"
              defaultValue={valoresIniciais?.debito_transporte_urbano}
            />
          </div>
          <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Crédito — valores recebidos e a receber ou restituir
            </p>
            <CampoNumero
              name="credito_recebidas_antecipadamente"
              label="Diárias recebidas antecipadamente"
              defaultValue={valoresIniciais?.credito_recebidas_antecipadamente}
            />
            <CampoNumero
              name="credito_reembolsar"
              label="Reembolsar diárias realizadas e não recebidas"
              defaultValue={valoresIniciais?.credito_reembolsar}
            />
            <CampoNumero
              name="credito_transporte_urbano"
              label="Despesas com transporte urbano, pedágio, combustível e estacionamento"
              defaultValue={valoresIniciais?.credito_transporte_urbano}
            />
            <CampoNumero
              name="credito_devolver"
              label="Devolver diárias recebidas e não realizadas (-)"
              defaultValue={valoresIniciais?.credito_devolver}
            />
          </div>
        </div>
      </div>

      <CampoOcultoRelatorio relatorio={relatorioAtual} />

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          formAction={actionVoltar}
          disabled={enviando}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          ← Voltar
        </button>
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light disabled:opacity-60"
        >
          {enviando ? "Salvando…" : "Próximo →"}
        </button>
      </div>
    </form>
  );
}
