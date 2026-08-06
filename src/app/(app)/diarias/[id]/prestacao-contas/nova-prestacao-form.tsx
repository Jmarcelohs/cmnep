"use client";

import { useState } from "react";

function CampoNumero({
  name,
  label,
  defaultValue = 0,
}: {
  name: string;
  label: string;
  defaultValue?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-medium text-slate-500">{label}</label>
      <input
        id={name}
        type="number"
        step="0.01"
        min={0}
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
      />
    </div>
  );
}

export type ValoresIniciaisPrestacao = {
  relatorio_resultado: string;
  debito_diarias_previstas: number;
  debito_diarias_nao_previstas: number;
  debito_transporte_aereo: number;
  debito_transporte_urbano: number;
  credito_recebidas_antecipadamente: number;
  credito_reembolsar: number;
  credito_transporte_urbano: number;
  credito_devolver: number;
};

export function NovaPrestacaoForm({
  action,
  valorAutorizado,
  valoresIniciais,
  modoRascunho = false,
}: {
  action: (formData: FormData) => void;
  valorAutorizado: number;
  valoresIniciais?: ValoresIniciaisPrestacao;
  // true quando a prestação ainda não foi enviada oficialmente (nova ou
  // rascunho salvo) — mostra os dois botões (rascunho/enviar) em vez de um
  // "Salvar alterações" só, usado pra editar uma prestação já enviada.
  modoRascunho?: boolean;
}) {
  const [relatorio, setRelatorio] = useState(valoresIniciais?.relatorio_resultado ?? "");
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
          rows={6}
          value={relatorio}
          onChange={(e) => setRelatorio(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

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

      {modoRascunho ? (
        <>
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
            &ldquo;Salvar rascunho&rdquo; guarda o que já foi preenchido sem enviar oficialmente —
            dá pra continuar depois. Ao clicar em &ldquo;Enviar prestação de contas&rdquo;, você
            declara, sob as penas da lei, que as informações prestadas são verídicas
            (autenticação do beneficiário exigida no Anexo II) e ela passa a valer pra decisão do
            ordenador, tesoureiro e Controle Interno.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              name="_acao"
              value="rascunho"
              formNoValidate
              disabled={enviando}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              {enviando ? "Salvando…" : "Salvar rascunho"}
            </button>
            <button
              type="submit"
              name="_acao"
              value="enviar"
              disabled={enviando}
              className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light disabled:opacity-60"
            >
              {enviando ? "Enviando…" : "Enviar prestação de contas"}
            </button>
          </div>
        </>
      ) : (
        <button
          type="submit"
          disabled={enviando}
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light disabled:opacity-60"
        >
          {enviando ? "Salvando…" : "Salvar alterações"}
        </button>
      )}
    </form>
  );
}
