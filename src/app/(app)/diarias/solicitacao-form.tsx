"use client";

import { useMemo, useState } from "react";
import { calcularTotalItens, calcularValorInternacional } from "@/lib/diarias/calculo";

type Pessoa = { id: string; nome: string; categoria: string };
type ValorTabela = { tipo: string; faixa: string; categoria: string; valor: number };

type Item = {
  modo: "tabela" | "manual";
  tipo: string;
  faixa: string;
  descricao_manual: string;
  quantidade: number;
  valor_unitario: number;
};

export type ValoresIniciais = {
  numero_diaria: string;
  numero_solicitacao: string;
  data_solicitacao: string;
  municipio_destino: string;
  uf_destino: string;
  instituicao_destino: string;
  contato_destino: string;
  data_partida: string;
  data_chegada: string;
  data_autorizacao: string;
  finalidade: string;
  itens: Item[];
};

const TIPOS = [
  { value: "semPernoite", label: "Sem pernoite" },
  { value: "comPernoite", label: "Com pernoite" },
];

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

function novoItem(): Item {
  return {
    modo: "tabela",
    tipo: "semPernoite",
    faixa: "",
    descricao_manual: "",
    quantidade: 1,
    valor_unitario: 0,
  };
}

export function SolicitacaoForm({
  action,
  pessoas,
  pessoaFixaId,
  tabelaValores,
  valoresIniciais,
  submitLabel,
}: {
  action: (formData: FormData) => void;
  pessoas: Pessoa[];
  pessoaFixaId?: string;
  tabelaValores: ValorTabela[];
  valoresIniciais?: ValoresIniciais;
  submitLabel: string;
}) {
  const [pessoaId, setPessoaId] = useState(pessoaFixaId ?? "");
  const [itens, setItens] = useState<Item[]>(
    valoresIniciais?.itens.length ? valoresIniciais.itens : [novoItem()],
  );

  const pessoaSelecionada = pessoas.find((p) => p.id === pessoaId);

  const faixasPorTipo = useMemo(() => {
    const map: Record<string, string[]> = { semPernoite: [], comPernoite: [] };
    for (const v of tabelaValores) {
      if (!map[v.tipo].includes(v.faixa)) map[v.tipo].push(v.faixa);
    }
    return map;
  }, [tabelaValores]);

  function atualizarItem(index: number, patch: Partial<Item>) {
    setItens((prev) => {
      const next = [...prev];
      const item = { ...next[index], ...patch };

      if (item.modo === "tabela" && pessoaSelecionada) {
        const encontrado = tabelaValores.find(
          (v) =>
            v.tipo === item.tipo &&
            v.faixa === item.faixa &&
            v.categoria === pessoaSelecionada.categoria,
        );
        item.valor_unitario = encontrado?.valor ?? 0;
      }

      next[index] = item;
      return next;
    });
  }

  const total = calcularTotalItens(itens);

  function aplicarDiariaInternacional(index: number, tipo: "comPernoite" | "semPernoite") {
    // Art. 8º-A (Resolução 51): 120% da diária de Brasília/capitais,
    // categoria Vereador — sempre essa base, mesmo que quem viaje seja
    // Efetivo/Comissionado. Recalcula a partir da tabela vigente em vez
    // de fixar o valor, como pede a especificação (mesma regra aplicada
    // à faixa sem pernoite).
    const base = tabelaValores.find(
      (v) => v.tipo === tipo && v.faixa === "Brasília e outras capitais" && v.categoria === "Vereador",
    );
    if (!base) return;
    const valor = calcularValorInternacional(base.valor);
    const rotulo = tipo === "comPernoite" ? "com pernoite" : "sem pernoite";
    atualizarItem(index, {
      descricao_manual: `Diária internacional (art. 8º-A) — 120% da diária ${rotulo} Brasília/capitais Vereador`,
      valor_unitario: valor,
    });
  }

  return (
    <form action={action} className="mt-6 space-y-6">
      <input
        type="hidden"
        name="itens"
        value={JSON.stringify(
          itens.map((item) => ({
            modo: item.modo,
            categoria: pessoaSelecionada?.categoria,
            tipo: item.modo === "tabela" ? item.tipo : undefined,
            faixa: item.modo === "tabela" ? item.faixa : undefined,
            descricao_manual: item.modo === "manual" ? item.descricao_manual : undefined,
            quantidade: item.quantidade,
            valor_unitario: item.valor_unitario,
          })),
        )}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pessoa_id" className="block text-sm font-medium text-slate-700">Solicitante</label>
          {pessoaFixaId ? (
            <>
              <input
                type="hidden"
                name="pessoa_id"
                value={pessoaFixaId}
              />
              <p className="mt-1 rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                {pessoaSelecionada?.nome} ({pessoaSelecionada?.categoria})
              </p>
            </>
          ) : (
            <select
              id="pessoa_id"
              name="pessoa_id"
              required
              value={pessoaId}
              onChange={(e) => setPessoaId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Selecione…</option>
              {pessoas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} ({p.categoria})
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label htmlFor="numero_diaria" className="block text-sm font-medium text-slate-700">Número da diária</label>
          <input
            id="numero_diaria"
            name="numero_diaria"
            defaultValue={valoresIniciais?.numero_diaria}
            placeholder={valoresIniciais ? undefined : "Deixe em branco para gerar automaticamente"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="numero_solicitacao" className="block text-sm font-medium text-slate-700">Número da solicitação</label>
          <input
            id="numero_solicitacao"
            name="numero_solicitacao"
            defaultValue={valoresIniciais?.numero_solicitacao}
            placeholder={valoresIniciais ? undefined : "Deixe em branco para gerar automaticamente"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="data_solicitacao" className="block text-sm font-medium text-slate-700">Data da solicitação</label>
          <input
            id="data_solicitacao"
            type="date"
            name="data_solicitacao"
            required
            defaultValue={valoresIniciais?.data_solicitacao}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="municipio_destino" className="block text-sm font-medium text-slate-700">Município/destino</label>
          <input
            id="municipio_destino"
            name="municipio_destino"
            required
            defaultValue={valoresIniciais?.municipio_destino}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="uf_destino" className="block text-sm font-medium text-slate-700">UF de destino</label>
          <select
            id="uf_destino"
            name="uf_destino"
            required
            defaultValue={valoresIniciais?.uf_destino ?? "MG"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="instituicao_destino" className="block text-sm font-medium text-slate-700">Instituição de destino</label>
          <input
            id="instituicao_destino"
            name="instituicao_destino"
            defaultValue={valoresIniciais?.instituicao_destino}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="contato_destino" className="block text-sm font-medium text-slate-700">Contato no destino</label>
          <input
            id="contato_destino"
            name="contato_destino"
            defaultValue={valoresIniciais?.contato_destino}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="data_partida" className="block text-sm font-medium text-slate-700">Data de partida</label>
          <input
            id="data_partida"
            type="date"
            name="data_partida"
            defaultValue={valoresIniciais?.data_partida}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="data_chegada" className="block text-sm font-medium text-slate-700">Data de chegada</label>
          <input
            id="data_chegada"
            type="date"
            name="data_chegada"
            defaultValue={valoresIniciais?.data_chegada}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        {valoresIniciais && (
          <div>
            <label htmlFor="data_autorizacao" className="block text-sm font-medium text-slate-700">Data de autorização</label>
            <input
              id="data_autorizacao"
              type="date"
              name="data_autorizacao"
              defaultValue={valoresIniciais.data_autorizacao}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              Só se aplica a diárias já autorizadas — ajuste aqui se precisar corrigir a data.
            </p>
          </div>
        )}
        <div className="sm:col-span-2">
          <label htmlFor="finalidade" className="block text-sm font-medium text-slate-700">Finalidade</label>
          <textarea
            id="finalidade"
            name="finalidade"
            required
            rows={3}
            defaultValue={valoresIniciais?.finalidade}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-700">Itens da diária</h2>
          <button
            type="button"
            onClick={() => setItens((prev) => [...prev, novoItem()])}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            + adicionar item
          </button>
        </div>

        <div className="mt-3 space-y-3">
          {itens.map((item, index) => (
            <div key={index} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <label htmlFor={`item-${index}-modo`} className="block text-xs font-medium text-slate-500">Modo</label>
                  <select
                    id={`item-${index}-modo`}
                    value={item.modo}
                    onChange={(e) => atualizarItem(index, { modo: e.target.value as Item["modo"] })}
                    className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  >
                    <option value="tabela">Tabela oficial</option>
                    <option value="manual">Manual (fora da tabela)</option>
                  </select>
                </div>

                {item.modo === "tabela" ? (
                  <>
                    <div>
                      <label htmlFor={`item-${index}-tipo`} className="block text-xs font-medium text-slate-500">Tipo</label>
                      <select
                        id={`item-${index}-tipo`}
                        value={item.tipo}
                        onChange={(e) =>
                          atualizarItem(index, { tipo: e.target.value, faixa: "" })
                        }
                        className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                      >
                        {TIPOS.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor={`item-${index}-faixa`} className="block text-xs font-medium text-slate-500">Faixa/destino</label>
                      <select
                        id={`item-${index}-faixa`}
                        value={item.faixa}
                        onChange={(e) => atualizarItem(index, { faixa: e.target.value })}
                        className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                      >
                        <option value="">Selecione…</option>
                        {(faixasPorTipo[item.tipo] ?? []).map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="min-w-[240px] flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <label htmlFor={`item-${index}-descricao`} className="block text-xs font-medium text-slate-500">Descrição</label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => aplicarDiariaInternacional(index, "comPernoite")}
                          className="text-xs text-slate-600 underline hover:text-slate-900"
                        >
                          Internacional com pernoite (120%)
                        </button>
                        <button
                          type="button"
                          onClick={() => aplicarDiariaInternacional(index, "semPernoite")}
                          className="text-xs text-slate-600 underline hover:text-slate-900"
                        >
                          Internacional sem pernoite (120%)
                        </button>
                      </div>
                    </div>
                    <input
                      id={`item-${index}-descricao`}
                      value={item.descricao_manual}
                      onChange={(e) => atualizarItem(index, { descricao_manual: e.target.value })}
                      placeholder="ex.: Diária internacional (art. 8º-A)"
                      className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                    />
                  </div>
                )}

                <div>
                  <label htmlFor={`item-${index}-quantidade`} className="block text-xs font-medium text-slate-500">Qtd.</label>
                  <input
                    id={`item-${index}-quantidade`}
                    type="number"
                    min={1}
                    value={item.quantidade}
                    onChange={(e) =>
                      atualizarItem(index, { quantidade: Number(e.target.value) || 1 })
                    }
                    className="mt-1 w-20 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor={`item-${index}-valor`} className="block text-xs font-medium text-slate-500">Valor unitário (R$)</label>
                  <input
                    id={`item-${index}-valor`}
                    type="number"
                    step="0.01"
                    min={0}
                    value={item.valor_unitario}
                    disabled={item.modo === "tabela"}
                    onChange={(e) =>
                      atualizarItem(index, { valor_unitario: Number(e.target.value) || 0 })
                    }
                    className="mt-1 w-28 rounded-md border border-slate-300 px-2 py-1.5 text-sm disabled:bg-slate-100"
                  />
                </div>

                {itens.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setItens((prev) => prev.filter((_, i) => i !== index))}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    remover
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-3 text-right text-sm font-medium text-slate-900">
          Total: {total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
        </p>
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
