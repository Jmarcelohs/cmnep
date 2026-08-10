"use client";

import { useMemo, useState } from "react";
import { corpoAberturaMocao, fechoMocao, PRESIDENTE, tituloMocao } from "@/lib/mocoes/documento";
import type { AutorAssociadoMocao, TipoMocao } from "@/lib/supabase/database.types";

export type ValoresIniciaisMocao = {
  tipo: TipoMocao;
  data_mocao: string;
  destinatario: string;
  autor_nome: string;
  autor_partido: string;
  autores_associados: AutorAssociadoMocao[];
  justificativa: string;
};

const OPCOES_TIPO: { value: TipoMocao; label: string }[] = [
  { value: "louvor", label: "Louvor" },
  { value: "congratulacoes", label: "Congratulações" },
  { value: "pesar", label: "Pesar" },
  { value: "repudio", label: "Repúdio" },
];

export function MocaoForm({
  action,
  valoresIniciais,
  submitLabel = "Salvar moção",
}: {
  action: (formData: FormData) => void;
  valoresIniciais?: ValoresIniciaisMocao;
  submitLabel?: string;
}) {
  const [tipo, setTipo] = useState<TipoMocao>(valoresIniciais?.tipo ?? "louvor");
  const [dataMocao, setDataMocao] = useState(valoresIniciais?.data_mocao ?? "");
  const [destinatario, setDestinatario] = useState(valoresIniciais?.destinatario ?? "");
  const [autorNome, setAutorNome] = useState(valoresIniciais?.autor_nome ?? "");
  const [autorPartido, setAutorPartido] = useState(valoresIniciais?.autor_partido ?? "");
  const [associados, setAssociados] = useState<AutorAssociadoMocao[]>(
    valoresIniciais?.autores_associados ?? [],
  );
  const [justificativa, setJustificativa] = useState(valoresIniciais?.justificativa ?? "");

  const abertura = useMemo(
    () =>
      corpoAberturaMocao({
        tipo,
        destinatario: destinatario || "—",
        autorNome: autorNome || "—",
        autorPartido: autorPartido || null,
      }),
    [tipo, destinatario, autorNome, autorPartido],
  );

  function atualizarAssociado(indice: number, campo: "nome" | "partido", valor: string) {
    setAssociados((atual) =>
      atual.map((a, i) => (i === indice ? { ...a, [campo]: campo === "partido" ? valor || null : valor } : a)),
    );
  }

  return (
    <form action={action} className="mt-6 space-y-6">
      <input type="hidden" name="autores_associados" value={JSON.stringify(associados)} />

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
            {OPCOES_TIPO.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
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
        <label htmlFor="destinatario" className="block text-sm font-medium text-slate-700">
          Destinatário (pessoa, entidade, órgão etc.)
        </label>
        <input
          id="destinatario"
          name="destinatario"
          value={destinatario}
          onChange={(e) => setDestinatario(e.target.value)}
          required
          placeholder="Ex.: Sr. Fulano de Tal, Associação de Moradores do Bairro X"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="autor_nome" className="block text-sm font-medium text-slate-700">Autor (vereador requerente)</label>
          <input
            id="autor_nome"
            name="autor_nome"
            value={autorNome}
            onChange={(e) => setAutorNome(e.target.value)}
            required
            placeholder="Nome do vereador"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="autor_partido" className="block text-sm font-medium text-slate-700">Partido (opcional)</label>
          <input
            id="autor_partido"
            name="autor_partido"
            value={autorPartido}
            onChange={(e) => setAutorPartido(e.target.value)}
            placeholder="Ex.: PL"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700">
            Vereadores associados (opcional)
          </label>
          <button
            type="button"
            onClick={() => setAssociados((atual) => [...atual, { nome: "", partido: null }])}
            className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            + Adicionar vereador
          </button>
        </div>
        {associados.length > 0 && (
          <div className="mt-2 space-y-2">
            {associados.map((a, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={a.nome}
                  onChange={(e) => atualizarAssociado(i, "nome", e.target.value)}
                  placeholder="Nome do vereador associado"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={a.partido ?? ""}
                  onChange={(e) => atualizarAssociado(i, "partido", e.target.value)}
                  placeholder="Partido"
                  className="w-32 rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setAssociados((atual) => atual.filter((_, idx) => idx !== i))}
                  className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label htmlFor="justificativa" className="block text-sm font-medium text-slate-700">Justificativa</label>
        <textarea
          id="justificativa"
          name="justificativa"
          rows={8}
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
          required
          placeholder="Motivos da moção — cada parágrafo vira um parágrafo separado no PDF"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Prévia do texto padronizado</p>
        <div className="mt-2 space-y-2 text-sm text-slate-700">
          <p className="text-center font-semibold">{tituloMocao(tipo)}</p>
          <p>{abertura}</p>
          {justificativa
            .split(/\n+/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          <p className="text-right">{fechoMocao(dataMocao)}</p>
          <p className="mt-4 text-xs text-slate-500">
            Assinam: {PRESIDENTE} (Presidente), {autorNome || "[autor]"}
            {associados.filter((a) => a.nome.trim()).length > 0 &&
              `, ${associados
                .filter((a) => a.nome.trim())
                .map((a) => a.nome)
                .join(", ")}`}
          </p>
        </div>
      </div>

      <button
        type="submit"
        className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
      >
        {submitLabel}
      </button>
    </form>
  );
}
