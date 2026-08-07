"use client";

import { useState } from "react";
import { CampoOcultoRelatorio, CamposOcultosFinanceiro } from "./campos-ocultos-prestacao";
import type { ValoresIniciaisPrestacao } from "./nova-prestacao-form";

export function FinalizarRascunhoForm({
  action,
  relatorioAtual,
  valorAutorizado,
  valoresIniciaisFinanceiro,
}: {
  action: (formData: FormData) => void;
  relatorioAtual: string;
  valorAutorizado: number;
  valoresIniciaisFinanceiro?: Omit<ValoresIniciaisPrestacao, "relatorio_resultado">;
}) {
  const [enviando, setEnviando] = useState(false);

  return (
    <form action={action} onSubmit={() => setEnviando(true)} className="mt-6 space-y-4">
      <CampoOcultoRelatorio relatorio={relatorioAtual} />
      <CamposOcultosFinanceiro valorAutorizado={valorAutorizado} valoresIniciais={valoresIniciaisFinanceiro} />

      <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
        &ldquo;Salvar rascunho&rdquo; guarda o que já foi preenchido sem enviar oficialmente — dá
        pra continuar depois. Ao clicar em &ldquo;Enviar prestação de contas&rdquo;, você declara,
        sob as penas da lei, que as informações prestadas são verídicas (autenticação do
        beneficiário exigida no Anexo II) e ela passa a valer pra decisão do ordenador, tesoureiro
        e Controle Interno.
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
    </form>
  );
}
