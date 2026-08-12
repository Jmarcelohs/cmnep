"use client";

import { useMemo, useState } from "react";
import { formatarMoeda } from "@/lib/pdf/formato";

export type FichaOpcao = {
  id: string;
  ficha: number;
  rotulo: string;
};

type Linha = { fichaId: string; valor: string };

export type ValoresIniciaisSuplementacao = {
  data_ato: string;
  numero_decreto: string;
  data_decreto: string;
  itensDestino: Linha[];
  itensOrigem: Linha[];
};

function totalLinhas(linhas: Linha[]): number {
  return linhas.reduce((soma, l) => soma + (Number(l.valor) || 0), 0);
}

function ListaLinhas({
  linhas,
  setLinhas,
  fichas,
  nomeCampo,
}: {
  linhas: Linha[];
  setLinhas: (linhas: Linha[]) => void;
  fichas: FichaOpcao[];
  nomeCampo: string;
}) {
  function atualizar(i: number, campo: keyof Linha, valor: string) {
    setLinhas(linhas.map((l, idx) => (idx === i ? { ...l, [campo]: valor } : l)));
  }
  function remover(i: number) {
    setLinhas(linhas.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-2">
      {linhas.map((linha, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2 rounded-md border border-slate-200 p-2">
          <div className="min-w-[16rem] flex-1">
            <label className="block text-xs font-medium text-slate-500">Ficha</label>
            <select
              value={linha.fichaId}
              onChange={(e) => atualizar(i, "fichaId", e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="" disabled>
                Selecione a ficha…
              </option>
              {fichas.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.rotulo}
                </option>
              ))}
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs font-medium text-slate-500">Valor</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={linha.valor}
              onChange={(e) => atualizar(i, "valor", e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => remover(i)}
            className="rounded-md px-2 py-1.5 text-xs text-red-600 hover:bg-red-50"
          >
            remover
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setLinhas([...linhas, { fichaId: "", valor: "" }])}
        className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        + item
      </button>
      <input type="hidden" name={nomeCampo} value={JSON.stringify(linhas)} />
    </div>
  );
}

export function SuplementacaoForm({
  action,
  fichas,
  valoresIniciais,
  submitLabel = "Salvar suplementação",
}: {
  action: (formData: FormData) => void;
  fichas: FichaOpcao[];
  valoresIniciais?: ValoresIniciaisSuplementacao;
  submitLabel?: string;
}) {
  const [dataAto, setDataAto] = useState(valoresIniciais?.data_ato ?? "");
  const [numeroDecreto, setNumeroDecreto] = useState(valoresIniciais?.numero_decreto ?? "");
  const [dataDecreto, setDataDecreto] = useState(valoresIniciais?.data_decreto ?? "");
  const [itensDestino, setItensDestino] = useState<Linha[]>(
    valoresIniciais?.itensDestino ?? [{ fichaId: "", valor: "" }],
  );
  const [itensOrigem, setItensOrigem] = useState<Linha[]>(
    valoresIniciais?.itensOrigem ?? [{ fichaId: "", valor: "" }],
  );

  const totalDestino = useMemo(() => totalLinhas(itensDestino), [itensDestino]);
  const totalOrigem = useMemo(() => totalLinhas(itensOrigem), [itensOrigem]);
  const totaisBatem = totalDestino > 0 && Math.abs(totalDestino - totalOrigem) < 0.01;

  return (
    <form action={action} className="mt-6 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="data_ato" className="block text-sm font-medium text-slate-700">
            Data do Ato
          </label>
          <input
            id="data_ato"
            type="date"
            name="data_ato"
            required
            value={dataAto}
            onChange={(e) => {
              setDataAto(e.target.value);
              if (!dataDecreto) setDataDecreto(e.target.value);
            }}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="numero_decreto" className="block text-sm font-medium text-slate-700">
            Número do Decreto (opcional)
          </label>
          <input
            id="numero_decreto"
            name="numero_decreto"
            value={numeroDecreto}
            onChange={(e) => setNumeroDecreto(e.target.value)}
            placeholder="Preencha quando a Prefeitura atribuir"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="data_decreto" className="block text-sm font-medium text-slate-700">
            Data do Decreto
          </label>
          <input
            id="data_decreto"
            type="date"
            name="data_decreto"
            value={dataDecreto}
            onChange={(e) => setDataDecreto(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-700">
          Destino — Art. 1º (crédito suplementar)
        </p>
        <div className="mt-3">
          <ListaLinhas
            linhas={itensDestino}
            setLinhas={setItensDestino}
            fichas={fichas}
            nomeCampo="itens_destino"
          />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Total: <span className="font-semibold">{formatarMoeda(totalDestino)}</span>
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-700">
          Origem — Art. 2º (anulação parcial)
        </p>
        <div className="mt-3">
          <ListaLinhas
            linhas={itensOrigem}
            setLinhas={setItensOrigem}
            fichas={fichas}
            nomeCampo="itens_origem"
          />
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Total: <span className="font-semibold">{formatarMoeda(totalOrigem)}</span>
        </p>
      </div>

      <p
        className={`text-sm font-medium ${totaisBatem ? "text-emerald-700" : "text-red-600"}`}
      >
        {totaisBatem
          ? `Os totais batem — ${formatarMoeda(totalDestino)}.`
          : "Os totais de destino e origem precisam ser iguais antes de salvar."}
      </p>

      <button
        type="submit"
        className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
      >
        {submitLabel}
      </button>
    </form>
  );
}
