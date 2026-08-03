"use client";

import { useMemo, useState } from "react";
import {
  artigosTituloHonorario,
  DOTACAO_ORCAMENTARIA_PADRAO,
  SUBTITULO_TITULO_HONORARIO,
  tituloProjetoDecreto,
} from "@/lib/decretos/documento";
import type { Tratamento } from "@/lib/supabase/database.types";

export type ValoresIniciaisDecreto = {
  numero: string;
  data_decreto: string;
  tratamento: Tratamento;
  nome_homenageado: string;
  autor_nome: string;
  autor_partido: string;
  dotacao_orcamentaria: string;
  justificativa: string;
};

export function DecretoForm({
  action,
  valoresIniciais,
  submitLabel = "Salvar decreto",
}: {
  action: (formData: FormData) => void;
  valoresIniciais?: ValoresIniciaisDecreto;
  submitLabel?: string;
}) {
  const [numero, setNumero] = useState(valoresIniciais?.numero ?? "");
  const [dataDecreto, setDataDecreto] = useState(valoresIniciais?.data_decreto ?? "");
  const [tratamento, setTratamento] = useState<Tratamento>(valoresIniciais?.tratamento ?? "Sr.");
  const [nomeHomenageado, setNomeHomenageado] = useState(valoresIniciais?.nome_homenageado ?? "");
  const [autorNome, setAutorNome] = useState(valoresIniciais?.autor_nome ?? "");
  const [autorPartido, setAutorPartido] = useState(valoresIniciais?.autor_partido ?? "");
  const [dotacao, setDotacao] = useState(
    valoresIniciais?.dotacao_orcamentaria || DOTACAO_ORCAMENTARIA_PADRAO,
  );
  const [justificativa, setJustificativa] = useState(valoresIniciais?.justificativa ?? "");

  const artigos = useMemo(
    () =>
      artigosTituloHonorario({
        tratamento,
        nomeHomenageado: nomeHomenageado || "—",
        dotacaoOrcamentaria: dotacao || "—",
      }),
    [tratamento, nomeHomenageado, dotacao],
  );

  return (
    <form action={action} className="mt-6 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-slate-700">Número</label>
          <input
            name="numero"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            required={Boolean(valoresIniciais)}
            placeholder={valoresIniciais ? undefined : "Deixe em branco para gerar automaticamente"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Data do decreto</label>
          <input
            type="date"
            name="data_decreto"
            required
            value={dataDecreto}
            onChange={(e) => setDataDecreto(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Tratamento</label>
          <select
            name="tratamento"
            value={tratamento}
            onChange={(e) => setTratamento(e.target.value as Tratamento)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="Sr.">Sr.</option>
            <option value="Sra.">Sra.</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Nome do homenageado</label>
        <input
          name="nome_homenageado"
          value={nomeHomenageado}
          onChange={(e) => setNomeHomenageado(e.target.value.toUpperCase())}
          required
          placeholder="NOME COMPLETO EM MAIÚSCULAS"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Autor (vereador proponente)</label>
          <input
            name="autor_nome"
            value={autorNome}
            onChange={(e) => setAutorNome(e.target.value)}
            required
            placeholder="Nome do vereador"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Partido (opcional)</label>
          <input
            name="autor_partido"
            value={autorPartido}
            onChange={(e) => setAutorPartido(e.target.value)}
            placeholder="Ex.: PL"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Dotação orçamentária (Art. 3º)</label>
        <input
          name="dotacao_orcamentaria"
          value={dotacao}
          onChange={(e) => setDotacao(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Justificativa</label>
        <textarea
          name="justificativa"
          rows={10}
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
          required
          placeholder="Trajetória e méritos do homenageado — cada parágrafo vira um parágrafo separado no PDF"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Prévia do texto padronizado</p>
        <div className="mt-2 space-y-2 text-sm text-slate-700">
          <p className="font-semibold">{tituloProjetoDecreto({ numero: numero || "—", dataDecreto })}</p>
          <p className="font-semibold uppercase">{SUBTITULO_TITULO_HONORARIO}</p>
          {artigos.map((artigo) => (
            <p key={artigo}>{artigo}</p>
          ))}
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
