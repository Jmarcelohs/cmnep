"use client";

import { useState } from "react";
import { LABEL_TIPO_MOCAO, TIPOS_MOCAO_DISPONIVEIS } from "@/lib/mocoes/documento";
import type { TipoMocao } from "@/lib/supabase/database.types";
import type { VereadorOpcao } from "../mocao-form";
import type { LinhaLoteMocao } from "./validacao";

export function MocoesLoteForm({
  action,
  vereadores,
}: {
  action: (formData: FormData) => void;
  vereadores: VereadorOpcao[];
}) {
  const [tipo, setTipo] = useState<TipoMocao>(TIPOS_MOCAO_DISPONIVEIS[0]);
  const [dataMocao, setDataMocao] = useState("");
  const [autorId, setAutorId] = useState("");
  const [associadosIds, setAssociadosIds] = useState<Set<string>>(new Set());
  const [justificativaPadrao, setJustificativaPadrao] = useState("");
  const [linhas, setLinhas] = useState<LinhaLoteMocao[]>([
    { destinatario: "", destinatario_tratamento: "Sr.", justificativa: "" },
  ]);

  function alternarAssociado(id: string) {
    setAssociadosIds((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  function atualizarLinha(indice: number, campo: keyof LinhaLoteMocao, valor: string) {
    setLinhas((atual) =>
      atual.map((l, i) => (i === indice ? { ...l, [campo]: valor } : l)),
    );
  }

  function adicionarLinha() {
    setLinhas((atual) => [
      ...atual,
      { destinatario: "", destinatario_tratamento: "Sr.", justificativa: justificativaPadrao },
    ]);
  }

  function removerLinha(indice: number) {
    setLinhas((atual) => atual.filter((_, i) => i !== indice));
  }

  function aplicarJustificativaATodas() {
    setLinhas((atual) => atual.map((l) => ({ ...l, justificativa: justificativaPadrao })));
  }

  return (
    <form action={action} className="mt-6 space-y-6">
      <input type="hidden" name="associados_vereadores_ids" value={JSON.stringify([...associadosIds])} />
      <input type="hidden" name="linhas" value={JSON.stringify(linhas)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="tipo" className="block text-sm font-medium text-slate-700">Tipo</label>
          <select
            id="tipo"
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoMocao)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {TIPOS_MOCAO_DISPONIVEIS.map((t) => (
              <option key={t} value={t}>
                {LABEL_TIPO_MOCAO[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="data_mocao" className="block text-sm font-medium text-slate-700">Data da sessão</label>
          <input
            id="data_mocao"
            type="date"
            name="data_mocao"
            required
            value={dataMocao}
            onChange={(e) => setDataMocao(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="autor_vereador_id" className="block text-sm font-medium text-slate-700">
          Autor (vereador requerente) — vale pra todas as moções do lote
        </label>
        <select
          id="autor_vereador_id"
          name="autor_vereador_id"
          value={autorId}
          onChange={(e) => setAutorId(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Selecione...</option>
          {vereadores.map((v) => (
            <option key={v.id} value={v.id}>
              {v.nome}
              {v.partido ? ` – ${v.partido}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Vereadores associados (opcional) — vale pra todas as moções do lote
        </label>
        <div className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-2">
          {vereadores
            .filter((v) => v.id !== autorId)
            .map((v) => (
              <label key={v.id} className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={associadosIds.has(v.id)}
                  onChange={() => alternarAssociado(v.id)}
                  className="rounded border-slate-300"
                />
                {v.nome}
                {v.partido ? ` – ${v.partido}` : ""}
              </label>
            ))}
        </div>
      </div>

      {tipo !== "pesar" && (
        <div>
          <label htmlFor="justificativa_padrao" className="block text-sm font-medium text-slate-700">
            Justificativa padrão
          </label>
          <div className="mt-1 flex gap-2">
            <textarea
              id="justificativa_padrao"
              rows={4}
              value={justificativaPadrao}
              onChange={(e) => setJustificativaPadrao(e.target.value)}
              placeholder="Preenche automaticamente as linhas novas — clique em “Aplicar a todas” pra sobrescrever as já preenchidas"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={aplicarJustificativaATodas}
            className="mt-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Aplicar a todas as linhas
          </button>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700">Homenageados</label>
          <button
            type="button"
            onClick={adicionarLinha}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            + Adicionar homenageado
          </button>
        </div>

        <div className="mt-2 space-y-3">
          {linhas.map((linha, i) => (
            <div key={i} className="rounded-md border border-slate-200 p-3">
              <div className="flex items-start gap-2">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={linha.destinatario}
                      onChange={(e) => atualizarLinha(i, "destinatario", e.target.value)}
                      placeholder={tipo === "pesar" ? "Nome do(a) falecido(a)" : "Nome do homenageado"}
                      className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                    {tipo === "pesar" && (
                      <select
                        value={linha.destinatario_tratamento ?? "Sr."}
                        onChange={(e) => atualizarLinha(i, "destinatario_tratamento", e.target.value)}
                        className="w-24 rounded-md border border-slate-300 px-2 py-2 text-sm"
                      >
                        <option value="Sr.">Sr.</option>
                        <option value="Sra.">Sra.</option>
                      </select>
                    )}
                  </div>
                  {tipo !== "pesar" && (
                    <textarea
                      value={linha.justificativa}
                      onChange={(e) => atualizarLinha(i, "justificativa", e.target.value)}
                      rows={3}
                      placeholder="Justificativa desta moção"
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removerLinha(i)}
                  disabled={linhas.length === 1}
                  className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
      >
        Criar {linhas.length} {linhas.length === 1 ? "moção" : "moções"}
      </button>
    </form>
  );
}
