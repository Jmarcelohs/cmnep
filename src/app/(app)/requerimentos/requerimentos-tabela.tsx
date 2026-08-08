"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatarMoeda } from "@/lib/pdf/formato";
import { SUBASSUNTO_TITULO } from "@/lib/reembolso/documento";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { MenuAcoes } from "@/components/menu-acoes";
import { excluirReembolso, decidirReembolsosEmLote } from "./actions";
import type { StatusRequerimentoReembolso } from "@/lib/supabase/database.types";

const STATUS_LABEL: Record<StatusRequerimentoReembolso, string> = {
  pendente: "Pendente",
  analise: "Em análise",
  deferido: "Deferido",
  indeferido: "Indeferido",
};

const STATUS_STYLES: Record<StatusRequerimentoReembolso, string> = {
  pendente: "bg-amber-50 text-amber-700",
  analise: "bg-slate-100 text-slate-600",
  deferido: "bg-emerald-50 text-emerald-700",
  indeferido: "bg-red-50 text-red-700",
};

type Requerimento = {
  id: string;
  protocolo: string;
  subassunto: string;
  valor: number;
  status: string;
  pessoa_id: string | null;
  municipio: string;
  pessoas: { nome: string } | null;
};

const LIMITE_NOMES_CONFIRMACAO = 15;

function mensagemConfirmacao(acao: string, protocolos: string[]) {
  const listados = protocolos.slice(0, LIMITE_NOMES_CONFIRMACAO).join("\n");
  const resto =
    protocolos.length > LIMITE_NOMES_CONFIRMACAO
      ? `\n…e mais ${protocolos.length - LIMITE_NOMES_CONFIRMACAO}`
      : "";
  return `Confirma ${acao} ${protocolos.length} requerimento(s) selecionado(s)?\n\n${listados}${resto}`;
}

export function RequerimentosTabela({
  requerimentos,
  podeGerenciarSempre,
  minhaPessoaId,
}: {
  requerimentos: Requerimento[];
  podeGerenciarSempre: boolean;
  minhaPessoaId: string | null;
}) {
  const router = useRouter();
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [resultado, setResultado] = useState<{
    aplicados: number;
    ignorados: { nome: string; motivo: string }[];
  } | null>(null);
  const [aplicando, startTransition] = useTransition();

  const decidiveis = requerimentos.filter((r) => r.status === "pendente" || r.status === "analise");
  const todosSelecionados = decidiveis.length > 0 && decidiveis.every((r) => selecionados.has(r.id));

  function alternar(id: string) {
    setResultado(null);
    setSelecionados((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function alternarTodos() {
    setResultado(null);
    setSelecionados(todosSelecionados ? new Set() : new Set(decidiveis.map((r) => r.id)));
  }

  function aplicar(decisao: "deferido" | "indeferido" | "analise") {
    const ids = Array.from(selecionados);
    const protocolos = requerimentos.filter((r) => selecionados.has(r.id)).map((r) => r.protocolo);
    const acao =
      decisao === "deferido" ? "deferir" : decisao === "indeferido" ? "indeferir" : "marcar em análise";
    if (!confirm(mensagemConfirmacao(acao, protocolos))) return;

    startTransition(async () => {
      const res = await decidirReembolsosEmLote(ids, decisao);
      setResultado(res);
      setSelecionados(new Set());
      router.refresh();
    });
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              {podeGerenciarSempre && (
                <th className="px-4 py-2">
                  <input
                    type="checkbox"
                    checked={todosSelecionados}
                    onChange={alternarTodos}
                    disabled={decidiveis.length === 0}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                </th>
              )}
              <th className="px-4 py-2 text-left font-medium text-slate-600">Protocolo</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Solicitante</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Sub-assunto</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Valor</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requerimentos.map((r) => {
              const podeExcluir = podeGerenciarSempre || minhaPessoaId === r.pessoa_id;
              const podeSelecionar = r.status === "pendente" || r.status === "analise";
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  {podeGerenciarSempre && (
                    <td className="px-4 py-2">
                      {podeSelecionar && (
                        <input
                          type="checkbox"
                          checked={selecionados.has(r.id)}
                          onChange={() => alternar(r.id)}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      )}
                    </td>
                  )}
                  <td className="px-4 py-2">
                    <Link href={`/requerimentos/${r.id}`} className="block text-slate-900">
                      {r.protocolo}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-700">{r.pessoas?.nome ?? "—"}</td>
                  <td className="px-4 py-2 text-slate-700">
                    {SUBASSUNTO_TITULO[r.subassunto as keyof typeof SUBASSUNTO_TITULO]}
                  </td>
                  <td className="px-4 py-2 text-slate-700">{formatarMoeda(r.valor)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[r.status as StatusRequerimentoReembolso] ?? ""}`}
                    >
                      {STATUS_LABEL[r.status as StatusRequerimentoReembolso] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <MenuAcoes>
                      <Link
                        href={`/requerimentos/${r.id}`}
                        className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Ver
                      </Link>
                      {podeExcluir && (
                        <Link
                          href={`/requerimentos/${r.id}/editar`}
                          className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Editar
                        </Link>
                      )}
                      {podeExcluir && (
                        <ExcluirSolicitacaoButton
                          variant="menu"
                          action={excluirReembolso.bind(null, r.id)}
                          mensagemConfirmacao={`Tem certeza que deseja excluir o requerimento ${r.protocolo}? Essa ação não pode ser desfeita.`}
                        />
                      )}
                    </MenuAcoes>
                  </td>
                </tr>
              );
            })}
            {requerimentos.length === 0 && (
              <tr>
                <td colSpan={podeGerenciarSempre ? 7 : 6} className="px-4 py-6 text-center text-slate-400">
                  Nenhum requerimento cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {podeGerenciarSempre && selecionados.size > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <span className="text-xs text-slate-600">{selecionados.size} selecionado(s):</span>
          <button
            type="button"
            onClick={() => aplicar("deferido")}
            disabled={aplicando}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            Deferir selecionados
          </button>
          <button
            type="button"
            onClick={() => aplicar("indeferido")}
            disabled={aplicando}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            Indeferir selecionados
          </button>
          <button
            type="button"
            onClick={() => aplicar("analise")}
            disabled={aplicando}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white disabled:opacity-60"
          >
            Marcar em análise
          </button>
        </div>
      )}

      {resultado && (
        <p className="mt-2 text-xs text-slate-600">
          {resultado.aplicados} aplicado(s).
          {resultado.ignorados.length > 0 &&
            ` ${resultado.ignorados.length} ignorado(s): ${resultado.ignorados
              .map((i) => `${i.nome} (${i.motivo})`)
              .join("; ")}.`}
        </p>
      )}
    </div>
  );
}
