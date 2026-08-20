"use client";

import { useEffect, useState } from "react";
import type { Contrato } from "@/lib/provisionamento/tipos";
import { carregarContratos, salvarContratos } from "@/lib/provisionamento/armazenamento";
import { ContratosTab } from "./contratos-tab";
import { ProvisionamentoTab } from "./provisionamento-tab";
import { DotacaoTab } from "./dotacao-tab";
import { ParametrosTab } from "./parametros-tab";

type Aba = "contratos" | "provisionamento" | "dotacao" | "parametros";

const ABAS: { valor: Aba; label: string }[] = [
  { valor: "contratos", label: "Contratos" },
  { valor: "provisionamento", label: "Provisionamento" },
  { valor: "dotacao", label: "Por Dotação/Ficha" },
  { valor: "parametros", label: "Parâmetros" },
];

export function ProvisionamentoApp() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [carregado, setCarregado] = useState(false);
  const [aba, setAba] = useState<Aba>("contratos");
  const [ano, setAno] = useState(() => new Date().getFullYear() + 1);

  // Carrega do localStorage só depois de montar — sincronizar dentro de
  // useState(() => carregarContratos()) rodaria a leitura durante o SSR
  // (window/localStorage não existem lá) e causaria divergência de
  // hidratação entre o HTML do servidor (sempre vazio) e o primeiro render
  // no navegador (que já teria os dados reais). O padrão "carregado=false
  // até o efeito rodar" é o jeito seguro de contornar isso.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- ver comentário acima
    setContratos(carregarContratos());
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (carregado) salvarContratos(contratos);
  }, [contratos, carregado]);

  return (
    <div>
      <div className="print:hidden">
        <h1 className="text-xl font-semibold text-brand-navy">Provisionamento Orçamentário</h1>
        <p className="mt-1 text-sm text-slate-500">
          Projeta, contrato a contrato, o valor a prever em cada ficha orçamentária a partir dos
          contratos administrativos vigentes. Ferramenta de planejamento interno — os dados ficam só
          neste navegador (não são salvos no sistema); exporte um backup em JSON com regularidade na
          aba Parâmetros. Confira sempre com a contabilidade/controle interno antes de usar os
          valores num rascunho oficial da LOA.
        </p>
      </div>

      <div className="mt-6 flex flex-wrap gap-1 border-b border-slate-200 print:hidden">
        {ABAS.map((a) => (
          <button
            key={a.valor}
            type="button"
            onClick={() => setAba(a.valor)}
            className={`rounded-t-md border border-b-0 px-4 py-2 text-sm font-medium ${
              aba === a.valor
                ? "border-slate-200 bg-white text-brand-navy"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="rounded-b-lg border border-t-0 border-slate-200 bg-white p-4 print:border-0 print:p-0 print:rounded-none">
        {!carregado ? (
          <p className="text-sm text-slate-500">Carregando…</p>
        ) : (
          <>
            {aba === "contratos" && <ContratosTab contratos={contratos} onAlterar={setContratos} />}
            {aba === "provisionamento" && (
              <ProvisionamentoTab contratos={contratos} ano={ano} onAlterarAno={setAno} />
            )}
            {aba === "dotacao" && <DotacaoTab contratos={contratos} ano={ano} />}
            {aba === "parametros" && (
              <ParametrosTab contratos={contratos} onImportar={setContratos} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
