"use client";

import { useState } from "react";
import type { Contrato, DotacaoOrcamentaria, LoaProjecao, NovaLoaLinha, NovoContrato } from "@/lib/provisionamento/tipos";
import {
  apagarTodosContratos,
  criarContrato,
  editarContrato,
  excluirContrato,
  importarContratos,
  salvarLoaProjecao,
  salvarValorTotalLoa,
} from "./actions";
import { ContratosTab } from "./contratos-tab";
import { ProvisionamentoTab } from "./provisionamento-tab";
import { DotacaoTab } from "./dotacao-tab";
import { ParametrosTab } from "./parametros-tab";
import { LoaTab } from "./loa-tab";

type Aba = "contratos" | "provisionamento" | "dotacao" | "parametros" | "loa";

const ABAS: { valor: Aba; label: string }[] = [
  { valor: "contratos", label: "Contratos" },
  { valor: "provisionamento", label: "Provisionamento" },
  { valor: "dotacao", label: "Por Dotação/Ficha" },
  { valor: "loa", label: "Proposta LOA 2027" },
  { valor: "parametros", label: "Parâmetros" },
];

export function ProvisionamentoApp({
  contratosIniciais,
  fichas,
  loaProjecaoInicial,
  valorTotalLoaInicial,
}: {
  contratosIniciais: Contrato[];
  fichas: DotacaoOrcamentaria[];
  loaProjecaoInicial: LoaProjecao[];
  valorTotalLoaInicial: number;
}) {
  const [contratos, setContratos] = useState<Contrato[]>(contratosIniciais);
  const [aba, setAba] = useState<Aba>("contratos");
  const [ano, setAno] = useState(() => new Date().getFullYear() + 1);
  const [erro, setErro] = useState<string | null>(null);

  function comErro<T>(promessa: Promise<T>): Promise<T | null> {
    setErro(null);
    return promessa.catch((err) => {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar — tente de novo.");
      return null;
    });
  }

  async function aoCriar(dados: NovoContrato) {
    const criado = await comErro(criarContrato(dados));
    if (criado) setContratos((atual) => [...atual, criado]);
  }

  async function aoEditar(id: string, dados: NovoContrato) {
    const atualizado = await comErro(editarContrato(id, dados));
    if (atualizado) setContratos((atual) => atual.map((c) => (c.id === id ? atualizado : c)));
  }

  async function aoExcluir(id: string) {
    const resultado = await comErro(excluirContrato(id));
    if (resultado !== null) setContratos((atual) => atual.filter((c) => c.id !== id));
  }

  async function aoImportar(lista: NovoContrato[]) {
    const importados = await comErro(importarContratos(lista));
    if (importados) setContratos(importados);
  }

  async function aoApagarTudo() {
    const resultado = await comErro(apagarTodosContratos());
    if (resultado !== null) setContratos([]);
  }

  async function aoSalvarLoa(linhas: NovaLoaLinha[]) {
    return comErro(salvarLoaProjecao(linhas));
  }

  async function aoSalvarValorTotalLoa(valor: number) {
    return comErro(salvarValorTotalLoa(valor));
  }

  return (
    <div>
      <div className="print:hidden">
        <h1 className="text-xl font-semibold text-brand-navy">Provisionamento Orçamentário</h1>
        <p className="mt-1 text-sm text-slate-500">
          Projeta, contrato a contrato, o valor a prever em cada ficha orçamentária a partir dos
          contratos administrativos vigentes. Ferramenta de planejamento interno — confira sempre
          com a contabilidade/controle interno antes de usar os valores num rascunho oficial da LOA.
        </p>
      </div>

      {erro && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 print:hidden">{erro}</p>
      )}

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
        {aba === "contratos" && (
          <ContratosTab
            contratos={contratos}
            fichas={fichas}
            onCriar={aoCriar}
            onEditar={aoEditar}
            onExcluir={aoExcluir}
          />
        )}
        {aba === "provisionamento" && (
          <ProvisionamentoTab contratos={contratos} ano={ano} onAlterarAno={setAno} />
        )}
        {aba === "dotacao" && <DotacaoTab contratos={contratos} ano={ano} />}
        {aba === "loa" && (
          <LoaTab
            linhasIniciais={loaProjecaoInicial}
            fichas={fichas}
            onSalvar={aoSalvarLoa}
            valorTotalInicial={valorTotalLoaInicial}
            onSalvarValorTotal={aoSalvarValorTotalLoa}
          />
        )}
        {aba === "parametros" && (
          <ParametrosTab contratos={contratos} onImportar={aoImportar} onApagarTudo={aoApagarTudo} />
        )}
      </div>
    </div>
  );
}
