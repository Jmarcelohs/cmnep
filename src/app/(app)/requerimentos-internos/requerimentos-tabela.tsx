"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatarData } from "@/lib/pdf/formato";
import { TIPO_LABEL } from "@/lib/requerimentos-internos/assuntos";
import { DownloadPdfButton } from "@/components/download-pdf-button";
import { ExcluirSolicitacaoButton } from "@/components/excluir-solicitacao-button";
import { MenuAcoes } from "@/components/menu-acoes";
import {
  autorizarRequerimentoInterno,
  decidirRequerimentosInternosEmLote,
  excluirRequerimentoInterno,
  marcarEmAnaliseRequerimentoInterno,
  naoAutorizarRequerimentoInterno,
} from "./actions";
import type { StatusRequerimentoInterno, TipoRequerimentoInterno } from "@/lib/supabase/database.types";

const STATUS_LABEL: Record<StatusRequerimentoInterno, string> = {
  pendente: "Pendente",
  analise: "Em análise",
  deferido: "Deferido",
  indeferido: "Indeferido",
};

const STATUS_STYLES: Record<StatusRequerimentoInterno, string> = {
  pendente: "bg-amber-50 text-amber-700",
  analise: "bg-slate-100 text-slate-600",
  deferido: "bg-emerald-50 text-emerald-700",
  indeferido: "bg-red-50 text-red-700",
};

type Requerimento = {
  id: string;
  numero: string;
  ano: number;
  tipo: string;
  nome: string;
  assunto: string;
  data_requerimento: string;
  status: string;
  pessoa_id: string | null;
};

const LIMITE_NOMES_CONFIRMACAO = 15;

function mensagemConfirmacao(acao: string, nomes: string[]) {
  const listados = nomes.slice(0, LIMITE_NOMES_CONFIRMACAO).join("\n");
  const resto =
    nomes.length > LIMITE_NOMES_CONFIRMACAO ? `\n…e mais ${nomes.length - LIMITE_NOMES_CONFIRMACAO}` : "";
  return `Confirma ${acao} ${nomes.length} requerimento(s) selecionado(s)?\n\n${listados}${resto}`;
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

  const decidiveis = podeGerenciarSempre
    ? requerimentos.filter((r) => r.status !== "deferido" && r.status !== "indeferido")
    : [];
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
    const nomes = requerimentos
      .filter((r) => selecionados.has(r.id))
      .map((r) => `${r.numero}/${r.ano}`);
    const acao =
      decisao === "deferido" ? "autorizar" : decisao === "indeferido" ? "não autorizar" : "marcar em análise";
    if (!confirm(mensagemConfirmacao(acao, nomes))) return;

    startTransition(async () => {
      const res = await decidirRequerimentosInternosEmLote(ids, decisao);
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
              <th className="px-4 py-2 text-left font-medium text-slate-600">Nº</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Categoria</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Solicitante</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Assunto</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Data</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {requerimentos.map((r) => {
              const podeGerenciar =
                podeGerenciarSempre || (r.pessoa_id && minhaPessoaId === r.pessoa_id);
              const podeEditar = podeGerenciar && r.status === "pendente";
              const podeExcluir = podeGerenciar;
              const podeDecidir =
                podeGerenciarSempre && r.status !== "deferido" && r.status !== "indeferido";
              return (
                <tr key={r.id} className="hover:bg-slate-50">
                  {podeGerenciarSempre && (
                    <td className="px-4 py-2">
                      {podeDecidir && (
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
                    <Link href={`/requerimentos-internos/${r.id}`} className="block text-slate-900">
                      {r.numero}/{r.ano}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-slate-700">{TIPO_LABEL[r.tipo as TipoRequerimentoInterno]}</td>
                  <td className="px-4 py-2 text-slate-700">{r.nome}</td>
                  <td className="px-4 py-2 text-slate-700">{r.assunto}</td>
                  <td className="px-4 py-2 text-slate-700">{formatarData(r.data_requerimento)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${STATUS_STYLES[r.status as StatusRequerimentoInterno] ?? ""}`}
                    >
                      {STATUS_LABEL[r.status as StatusRequerimentoInterno] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <MenuAcoes>
                      <Link
                        href={`/requerimentos-internos/${r.id}`}
                        className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        Ver
                      </Link>
                      {podeEditar && (
                        <Link
                          href={`/requerimentos-internos/${r.id}/editar`}
                          className="block w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          Editar
                        </Link>
                      )}
                      <DownloadPdfButton
                        variant="menu"
                        url={`/api/requerimentos-internos/${r.id}/pdf`}
                        nomeArquivoPadrao={`requerimento-${r.numero}-${r.ano}.pdf`}
                      />
                      {podeDecidir && (
                        <>
                          <form action={autorizarRequerimentoInterno.bind(null, r.id)}>
                            <button
                              type="submit"
                              className="block w-full px-3 py-2 text-left text-sm text-emerald-700 hover:bg-emerald-50"
                            >
                              Autorizar
                            </button>
                          </form>
                          <form action={naoAutorizarRequerimentoInterno.bind(null, r.id)}>
                            <button
                              type="submit"
                              className="block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                            >
                              Não autorizar
                            </button>
                          </form>
                          {r.status !== "analise" && (
                            <form action={marcarEmAnaliseRequerimentoInterno.bind(null, r.id)}>
                              <button
                                type="submit"
                                className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                              >
                                Marcar em análise
                              </button>
                            </form>
                          )}
                        </>
                      )}
                      {podeExcluir && (
                        <ExcluirSolicitacaoButton
                          variant="menu"
                          action={excluirRequerimentoInterno.bind(null, r.id)}
                          mensagemConfirmacao={`Tem certeza que deseja excluir o requerimento ${r.numero}/${r.ano}? Essa ação não pode ser desfeita.`}
                        />
                      )}
                    </MenuAcoes>
                  </td>
                </tr>
              );
            })}
            {requerimentos.length === 0 && (
              <tr>
                <td colSpan={podeGerenciarSempre ? 8 : 7} className="px-4 py-6 text-center text-slate-400">
                  Nenhum requerimento encontrado.
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
            Autorizar selecionados
          </button>
          <button
            type="button"
            onClick={() => aplicar("indeferido")}
            disabled={aplicando}
            className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            Não autorizar selecionados
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
