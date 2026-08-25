"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProcessoForm } from "../../processo-form";
import { editarProcesso } from "../../actions";
import type { DotacaoOrcamentaria } from "@/lib/suplementacoes/documento";
import type { NovoProcesso, PessoaResumo, Processo } from "@/lib/licitacoes/tipos";

export function EditarProcessoClient({
  processo,
  fichas,
  pessoas,
}: {
  processo: Processo;
  fichas: DotacaoOrcamentaria[];
  pessoas: PessoaResumo[];
}) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(dados: NovoProcesso) {
    setSalvando(true);
    setErro(null);
    try {
      await editarProcesso(processo.id, dados);
      router.push(`/licitacoes/${processo.id}`);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar o processo.");
      setSalvando(false);
    }
  }

  return (
    <div>
      {erro && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
      <ProcessoForm
        valoresIniciais={processo}
        fichas={fichas}
        pessoas={pessoas}
        onSalvar={salvar}
        onCancelar={() => router.push(`/licitacoes/${processo.id}`)}
        salvando={salvando}
      />
    </div>
  );
}
