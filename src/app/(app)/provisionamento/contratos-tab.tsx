"use client";

import { useState } from "react";
import { formatarData, formatarMoeda } from "@/lib/pdf/formato";
import { baixarArquivo, montarCsv } from "@/lib/provisionamento/csv";
import { INDICES_CORRECAO, MODALIDADES, rotuloFicha, SITUACOES } from "@/lib/provisionamento/tipos";
import type { Contrato, DotacaoOrcamentaria, NovoContrato } from "@/lib/provisionamento/tipos";

const CAMPOS_INICIAIS: NovoContrato = {
  nome: "",
  fornecedor: "",
  modalidade: "fixo",
  valorVigente: 0,
  tipoValor: "mensal",
  valorUnitario: null,
  unidadeMedida: null,
  quantidadeEstimadaMensal: null,
  dataInicioVigencia: "",
  dataFimVigencia: "",
  dataProximoReajuste: "",
  indiceCorrecao: "IPCA",
  percentualEstimado: 0,
  situacao: "continua",
  valorNovoContratoEstimado: null,
  dataInicioNovoContrato: null,
  fichaId: null,
  observacoes: "",
};

function ContratoForm({
  valoresIniciais,
  fichas,
  onSalvar,
  onCancelar,
  salvando,
}: {
  valoresIniciais: Contrato | null;
  fichas: DotacaoOrcamentaria[];
  onSalvar: (dados: NovoContrato) => void;
  onCancelar: () => void;
  salvando: boolean;
}) {
  const [campos, setCampos] = useState<NovoContrato>(valoresIniciais ?? CAMPOS_INICIAIS);
  // Percentual guardado como fração (0.05) — o campo mostra/edita como
  // número inteiro/decimal (5), convertido só na entrada/saída.
  const [percentualExibido, setPercentualExibido] = useState(
    valoresIniciais ? String(valoresIniciais.percentualEstimado * 100) : "",
  );

  function atualizar<K extends keyof NovoContrato>(campo: K, valor: NovoContrato[K]) {
    setCampos((c) => ({ ...c, [campo]: valor }));
  }

  function aoSalvar(e: React.FormEvent) {
    e.preventDefault();
    onSalvar(campos);
  }

  return (
    <form onSubmit={aoSalvar} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Objeto do contrato</label>
          <input
            value={campos.nome}
            onChange={(e) => atualizar("nome", e.target.value)}
            required
            placeholder="Ex.: Prestação de serviços de limpeza e conservação"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Fornecedor</label>
          <input
            value={campos.fornecedor}
            onChange={(e) => atualizar("fornecedor", e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Modalidade de cobrança</label>
          <select
            value={campos.modalidade}
            onChange={(e) => {
              const modalidade = e.target.value as NovoContrato["modalidade"];
              setCampos((c) => ({
                ...c,
                modalidade,
                valorVigente: modalidade === "fixo" ? c.valorVigente || 0 : null,
                tipoValor: modalidade === "fixo" ? c.tipoValor ?? "mensal" : null,
                valorUnitario: modalidade === "unidade" ? c.valorUnitario ?? 0 : null,
                unidadeMedida: modalidade === "unidade" ? c.unidadeMedida ?? "" : null,
                quantidadeEstimadaMensal: modalidade === "unidade" ? c.quantidadeEstimadaMensal ?? 0 : null,
              }));
            }}
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
          >
            {MODALIDADES.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Por unidade/serviço: contratos sem valor mensal fixo — ex.: R$ por entrega de motoboy, R$
            por km rodado de táxi/van, R$ por publicação no jornal. O valor mensal provisionado é o
            preço unitário multiplicado pela quantidade estimada por mês.
          </p>
        </div>

        {campos.modalidade === "fixo" ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Valor vigente</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={campos.valorVigente || ""}
                onChange={(e) => atualizar("valorVigente", Number(e.target.value) || 0)}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Periodicidade</label>
              <select
                value={campos.tipoValor ?? "mensal"}
                onChange={(e) => atualizar("tipoValor", e.target.value as NovoContrato["tipoValor"])}
                className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
              >
                <option value="mensal">Mensal</option>
                <option value="anual">Anual</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Preço unitário</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={campos.valorUnitario || ""}
                onChange={(e) => atualizar("valorUnitario", Number(e.target.value) || 0)}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Unidade</label>
              <input
                value={campos.unidadeMedida ?? ""}
                onChange={(e) => atualizar("unidadeMedida", e.target.value)}
                placeholder="Ex.: entrega, km, publicação"
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Qtd. estimada/mês</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={campos.quantidadeEstimadaMensal || ""}
                onChange={(e) => atualizar("quantidadeEstimadaMensal", Number(e.target.value) || 0)}
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-700">Vigência e reajuste</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Início da vigência</label>
            <input
              type="date"
              value={campos.dataInicioVigencia}
              onChange={(e) => atualizar("dataInicioVigencia", e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Fim da vigência atual</label>
            <input
              type="date"
              value={campos.dataFimVigencia}
              onChange={(e) => atualizar("dataFimVigencia", e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Próximo reajuste</label>
            <input
              type="date"
              value={campos.dataProximoReajuste}
              onChange={(e) => atualizar("dataProximoReajuste", e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              Data-âncora — a ferramenta conta os aniversários anuais dela pra frente.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Índice de correção</label>
            <select
              value={campos.indiceCorrecao}
              onChange={(e) =>
                atualizar("indiceCorrecao", e.target.value as NovoContrato["indiceCorrecao"])
              }
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
            >
              {INDICES_CORRECAO.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-slate-500">Só referência — não entra no cálculo.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Percentual estimado por reajuste
            </label>
            <div className="mt-1 flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                value={percentualExibido}
                onChange={(e) => {
                  setPercentualExibido(e.target.value);
                  atualizar("percentualEstimado", (Number(e.target.value) || 0) / 100);
                }}
                required
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-700">Situação em relação ao ano de referência</p>
        <div className="mt-3 space-y-2">
          {SITUACOES.map((s) => (
            <label key={s.valor} className="flex items-start gap-2 text-sm">
              <input
                type="radio"
                name="situacao"
                checked={campos.situacao === s.valor}
                onChange={() => atualizar("situacao", s.valor)}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-slate-700">{s.label}</span>
                <span className="block text-xs text-slate-500">{s.descricao}</span>
              </span>
            </label>
          ))}
        </div>

        {campos.situacao === "nova_licitacao" && (
          <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Valor mensal estimado do novo contrato
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={campos.valorNovoContratoEstimado ?? ""}
                onChange={(e) =>
                  atualizar("valorNovoContratoEstimado", e.target.value ? Number(e.target.value) : null)
                }
                placeholder="Preencha quando tiver uma estimativa"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Data prevista de início do novo contrato
              </label>
              <input
                type="date"
                value={campos.dataInicioNovoContrato ?? ""}
                onChange={(e) => atualizar("dataInicioNovoContrato", e.target.value || null)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-700">Ficha orçamentária</p>
        <div className="mt-3">
          <select
            value={campos.fichaId ?? ""}
            onChange={(e) => atualizar("fichaId", e.target.value || null)}
            className="w-full rounded-md border border-slate-300 px-2 py-2 text-sm"
          >
            <option value="">Sem ficha vinculada ainda</option>
            {fichas.map((f) => (
              <option key={f.id} value={f.id}>
                {rotuloFicha(f)}
              </option>
            ))}
          </select>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          Mesmo cadastro de fichas usado em Suplementações Orçamentárias — o consolidado por
          dotação/ficha agrupa por ela.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          Observações (ex.: histórico de prorrogações, limite legal do art. 107 da Lei 14.133/2021)
        </label>
        <textarea
          value={campos.observacoes}
          onChange={(e) => atualizar("observacoes", e.target.value)}
          rows={3}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Salvar contrato"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={salvando}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function rotuloSituacao(valor: Contrato["situacao"]): string {
  return SITUACOES.find((s) => s.valor === valor)?.label ?? valor;
}

export function ContratosTab({
  contratos,
  fichas,
  onCriar,
  onEditar,
  onExcluir,
}: {
  contratos: Contrato[];
  fichas: DotacaoOrcamentaria[];
  onCriar: (dados: NovoContrato) => Promise<void>;
  onEditar: (id: string, dados: NovoContrato) => Promise<void>;
  onExcluir: (id: string) => Promise<void>;
}) {
  const [editando, setEditando] = useState<Contrato | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function salvar(dados: NovoContrato) {
    setSalvando(true);
    try {
      if (editando) {
        await onEditar(editando.id, dados);
      } else {
        await onCriar(dados);
      }
      setMostrarForm(false);
      setEditando(null);
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(contrato: Contrato) {
    if (!window.confirm(`Excluir o contrato "${contrato.nome}"? Essa ação não pode ser desfeita.`)) return;
    await onExcluir(contrato.id);
  }

  function exportarCsv() {
    const cabecalho = [
      "Objeto",
      "Fornecedor",
      "Modalidade",
      "Valor vigente",
      "Periodicidade",
      "Preço unitário",
      "Unidade",
      "Qtd. estimada/mês",
      "Início vigência",
      "Fim vigência",
      "Próximo reajuste",
      "Índice",
      "Percentual estimado (%)",
      "Situação",
      "Valor novo contrato",
      "Início novo contrato",
      "Ficha",
      "Dotação",
      "Observações",
    ];
    const linhas = contratos.map((c) => [
      c.nome,
      c.fornecedor,
      c.modalidade === "unidade" ? "Por unidade/serviço" : "Valor fixo",
      c.valorVigente ?? "",
      c.tipoValor ?? "",
      c.valorUnitario ?? "",
      c.unidadeMedida ?? "",
      c.quantidadeEstimadaMensal ?? "",
      c.dataInicioVigencia,
      c.dataFimVigencia,
      c.dataProximoReajuste,
      c.indiceCorrecao,
      (c.percentualEstimado * 100).toFixed(2),
      rotuloSituacao(c.situacao),
      c.valorNovoContratoEstimado ?? "",
      c.dataInicioNovoContrato ?? "",
      c.ficha ? c.ficha.ficha : "",
      c.ficha ? `${c.ficha.orgao_codigo}.${c.ficha.unidade_codigo}.${c.ficha.subfuncao_codigo}.${c.ficha.programa_codigo}.${c.ficha.projeto_atividade_codigo}.${c.ficha.elemento_codigo}.${c.ficha.fonte_codigo}` : "",
      c.observacoes,
    ]);
    baixarArquivo("contratos.csv", montarCsv(cabecalho, linhas), "text/csv;charset=utf-8");
  }

  if (mostrarForm) {
    return (
      <ContratoForm
        valoresIniciais={editando}
        fichas={fichas}
        onSalvar={salvar}
        salvando={salvando}
        onCancelar={() => {
          setMostrarForm(false);
          setEditando(null);
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-600">
          {contratos.length} contrato{contratos.length === 1 ? "" : "s"} cadastrado
          {contratos.length === 1 ? "" : "s"}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportarCsv}
            disabled={contratos.length === 0}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setEditando(null);
              setMostrarForm(true);
            }}
            className="rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
          >
            + Novo contrato
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-brand-navy/5">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Objeto</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Valor vigente</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Vigência</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Situação</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Ficha</th>
              <th className="px-4 py-2 text-left font-medium text-slate-600">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contratos.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 text-slate-900">
                  {c.nome}
                  {c.fornecedor && <span className="block text-xs text-slate-500">{c.fornecedor}</span>}
                </td>
                <td className="px-4 py-2 text-slate-700">
                  {c.modalidade === "unidade" ? (
                    <>
                      {formatarMoeda(c.valorUnitario ?? 0)} / {c.unidadeMedida || "unidade"}
                      <span className="block text-xs text-slate-500">
                        ~{c.quantidadeEstimadaMensal ?? 0} por mês
                      </span>
                    </>
                  ) : (
                    <>
                      {formatarMoeda(c.valorVigente ?? 0)}
                      <span className="block text-xs text-slate-500">
                        {c.tipoValor === "anual" ? "anual" : "mensal"}
                      </span>
                    </>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-700">
                  {formatarData(c.dataInicioVigencia)} a {formatarData(c.dataFimVigencia)}
                </td>
                <td className="px-4 py-2 text-slate-700">{rotuloSituacao(c.situacao)}</td>
                <td className="px-4 py-2 text-slate-700">{c.ficha ? `Ficha ${c.ficha.ficha}` : "—"}</td>
                <td className="px-4 py-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditando(c);
                        setMostrarForm(true);
                      }}
                      className="text-xs font-medium text-brand-navy hover:underline"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => excluir(c)}
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {contratos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  Nenhum contrato cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
