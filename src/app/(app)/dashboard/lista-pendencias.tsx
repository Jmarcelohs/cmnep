"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { ItemPendente } from "@/lib/dashboard/pendencias";
import type { Parecer } from "@/lib/supabase/database.types";

type ResultadoLote = {
  aplicados: number;
  ignorados: { nome: string; motivo: string }[];
};

type LoteAprovacao = {
  tipo: "aprovacao";
  executar: (ids: string[]) => Promise<ResultadoLote>;
};

type LoteParecer = {
  tipo: "parecer";
  executar: (ids: string[], parecer: Parecer, observacao: string | null) => Promise<ResultadoLote>;
};

const LIMITE_NOMES_CONFIRMACAO = 15;

function mensagemConfirmacao(acao: string, nomes: string[]) {
  const listados = nomes.slice(0, LIMITE_NOMES_CONFIRMACAO).join("\n");
  const resto =
    nomes.length > LIMITE_NOMES_CONFIRMACAO
      ? `\n…e mais ${nomes.length - LIMITE_NOMES_CONFIRMACAO}`
      : "";
  return `Confirma ${acao} ${nomes.length} prestação(ões) de contas selecionada(s)?\n\n${listados}${resto}`;
}

export function ListaPendencias({
  titulo,
  itens,
  lote,
}: {
  titulo: string;
  itens: ItemPendente[];
  lote?: LoteAprovacao | LoteParecer;
}) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [resultado, setResultado] = useState<ResultadoLote | null>(null);
  const [parecer, setParecer] = useState<Parecer>("aprovacao_sem_ressalvas");
  const [observacao, setObservacao] = useState("");
  const [aplicando, startTransition] = useTransition();

  function alternar(id: string) {
    setResultado(null);
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function aplicar() {
    if (!lote) return;
    const ids = Array.from(selecionados);
    const nomes = itens.filter((i) => selecionados.has(i.prestacaoId)).map((i) => i.nome);
    const acao = lote.tipo === "aprovacao" ? "aprovar" : "aplicar o parecer escolhido a";
    if (!confirm(mensagemConfirmacao(acao, nomes))) return;

    startTransition(async () => {
      const res =
        lote.tipo === "aprovacao"
          ? await lote.executar(ids)
          : await lote.executar(ids, parecer, observacao.trim() || null);
      setResultado(res);
      setSelecionados(new Set());
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-amber-700">
        {titulo} ({itens.length})
      </p>
      <ul className="mt-2 space-y-1 text-sm">
        {itens.map((item) => (
          <li key={item.prestacaoId} className="flex items-center gap-2">
            {lote && (
              <input
                type="checkbox"
                checked={selecionados.has(item.prestacaoId)}
                onChange={() => alternar(item.prestacaoId)}
                className="h-4 w-4 rounded border-slate-300"
              />
            )}
            <Link
              href={`/diarias/${item.solicitacaoId}/prestacao-contas`}
              className="text-slate-900 hover:underline"
            >
              {item.nome}
            </Link>
          </li>
        ))}
        {itens.length === 0 && <li className="text-slate-400">Nenhuma pendência.</li>}
      </ul>

      {lote && selecionados.size > 0 && (
        <div className="mt-3 space-y-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          {lote.tipo === "parecer" && (
            <>
              <select
                value={parecer}
                onChange={(e) => setParecer(e.target.value as Parecer)}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
              >
                <option value="aprovacao_sem_ressalvas">Aprovação sem ressalvas</option>
                <option value="aprovacao_com_ressalvas">Aprovação com ressalvas</option>
                <option value="reprovacao">Reprovação</option>
              </select>
              <textarea
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observação (opcional, aplicada a todas)"
                rows={2}
                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs"
              />
            </>
          )}
          <button
            type="button"
            onClick={aplicar}
            disabled={aplicando}
            className="rounded-md bg-brand-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-navy-light disabled:opacity-60"
          >
            {aplicando
              ? "Aplicando…"
              : lote.tipo === "aprovacao"
                ? `Aprovar ${selecionados.size} selecionada(s)`
                : `Aplicar parecer a ${selecionados.size} selecionada(s)`}
          </button>
        </div>
      )}

      {resultado && (
        <p className="mt-2 text-xs text-slate-600">
          {resultado.aplicados} aplicada(s).
          {resultado.ignorados.length > 0 &&
            ` ${resultado.ignorados.length} ignorada(s): ${resultado.ignorados
              .map((i) => `${i.nome} (${i.motivo})`)
              .join("; ")}.`}
        </p>
      )}
    </div>
  );
}
