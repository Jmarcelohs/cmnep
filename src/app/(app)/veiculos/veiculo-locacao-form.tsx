"use client";

import { useMemo, useState } from "react";
import { mensagemSolicitacaoVeiculo } from "@/lib/veiculos-locacao/documento";
import { formatarValorDigitado } from "@/lib/reembolso/mascaras";

type Pessoa = { id: string; nome: string; matricula: string | null; cargo: string };
type Item = { id: string; codigo: string; descricao: string; faixa_km: string | null; valor_diaria: number };

export type ValoresIniciaisVeiculo = {
  numero: string;
  data_pedido: string;
  processo: string;
  locadora: string;
  pessoa_solicitante_id: string;
  solicitante_nome: string;
  solicitante_matricula: string;
  solicitante_cargo: string;
  pessoa_condutor_id: string;
  condutor_nome: string;
  condutor_matricula: string;
  condutor_cargo: string;
  item_id: string;
  veiculo_descricao: string;
  valor_diaria: number;
  qtd_diarias: number;
  data_retirada: string;
  hora_retirada: string;
  local_retirada: string;
  data_devolucao: string;
  hora_devolucao: string;
  local_devolucao: string;
  observacoes: string;
};

function SeletorPessoa({
  pessoas,
  pessoaId,
  nome,
  matricula,
  cargo,
  onChangePessoaId,
  onChangeNome,
  onChangeMatricula,
  onChangeCargo,
  namePrefix,
}: {
  pessoas: Pessoa[];
  pessoaId: string;
  nome: string;
  matricula: string;
  cargo: string;
  onChangePessoaId: (id: string) => void;
  onChangeNome: (v: string) => void;
  onChangeMatricula: (v: string) => void;
  onChangeCargo: (v: string) => void;
  namePrefix: string;
}) {
  const modoOutro = pessoaId === "outro";

  return (
    <div className="space-y-2">
      <input type="hidden" name={`pessoa_${namePrefix}_id`} value={modoOutro ? "" : pessoaId} />
      <input type="hidden" name={`${namePrefix}_nome`} value={nome} />
      <input type="hidden" name={`${namePrefix}_matricula`} value={matricula} />
      <input type="hidden" name={`${namePrefix}_cargo`} value={cargo} />

      <select
        value={pessoaId}
        onChange={(e) => {
          const id = e.target.value;
          onChangePessoaId(id);
          if (id === "outro") {
            onChangeNome("");
            onChangeMatricula("");
            onChangeCargo("");
          } else {
            const pessoa = pessoas.find((p) => p.id === id);
            onChangeNome(pessoa?.nome ?? "");
            onChangeMatricula(pessoa?.matricula ?? "");
            onChangeCargo(pessoa?.cargo ?? "");
          }
        }}
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="">Selecione…</option>
        {pessoas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
        <option value="outro">Outro (fora do cadastro)</option>
      </select>

      {modoOutro && (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <input
            value={nome}
            onChange={(e) => onChangeNome(e.target.value)}
            placeholder="Nome completo"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm sm:col-span-1"
          />
          <input
            value={matricula}
            onChange={(e) => onChangeMatricula(e.target.value)}
            placeholder="Matrícula (opcional)"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
          <input
            value={cargo}
            onChange={(e) => onChangeCargo(e.target.value)}
            placeholder="Cargo/função"
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm"
          />
        </div>
      )}
    </div>
  );
}

export function VeiculoLocacaoForm({
  action,
  pessoas,
  itens,
  valoresIniciais,
  submitLabel = "Salvar solicitação",
}: {
  action: (formData: FormData) => void;
  pessoas: Pessoa[];
  itens: Item[];
  valoresIniciais?: ValoresIniciaisVeiculo;
  submitLabel?: string;
}) {
  const [pessoaSolicitanteId, setPessoaSolicitanteId] = useState(
    valoresIniciais?.pessoa_solicitante_id || (valoresIniciais ? "outro" : ""),
  );
  const [solicitanteNome, setSolicitanteNome] = useState(valoresIniciais?.solicitante_nome ?? "");
  const [solicitanteMatricula, setSolicitanteMatricula] = useState(
    valoresIniciais?.solicitante_matricula ?? "",
  );
  const [solicitanteCargo, setSolicitanteCargo] = useState(valoresIniciais?.solicitante_cargo ?? "");

  const [mesmoCondutor, setMesmoCondutor] = useState(false);
  const [pessoaCondutorId, setPessoaCondutorId] = useState(
    valoresIniciais?.pessoa_condutor_id || (valoresIniciais ? "outro" : ""),
  );
  const [condutorNome, setCondutorNome] = useState(valoresIniciais?.condutor_nome ?? "");
  const [condutorMatricula, setCondutorMatricula] = useState(valoresIniciais?.condutor_matricula ?? "");
  const [condutorCargo, setCondutorCargo] = useState(valoresIniciais?.condutor_cargo ?? "");

  const [itemId, setItemId] = useState(valoresIniciais?.item_id ?? "");
  const [veiculoDescricao, setVeiculoDescricao] = useState(valoresIniciais?.veiculo_descricao ?? "");
  const valorInicialTexto = valoresIniciais?.valor_diaria
    ? valoresIniciais.valor_diaria.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "";
  const [valorDiariaTexto, setValorDiariaTexto] = useState(valorInicialTexto);
  const [valorDiaria, setValorDiaria] = useState(valoresIniciais?.valor_diaria ?? 0);
  const [qtdDiarias, setQtdDiarias] = useState(valoresIniciais?.qtd_diarias ?? 1);

  const [dataPedido, setDataPedido] = useState(valoresIniciais?.data_pedido ?? "");
  const [dataRetirada, setDataRetirada] = useState(valoresIniciais?.data_retirada ?? "");
  const [horaRetirada, setHoraRetirada] = useState(valoresIniciais?.hora_retirada ?? "");
  const [localRetirada, setLocalRetirada] = useState(
    valoresIniciais?.local_retirada ?? "Câmara Municipal de Nepomuceno",
  );
  const [dataDevolucao, setDataDevolucao] = useState(valoresIniciais?.data_devolucao ?? "");
  const [horaDevolucao, setHoraDevolucao] = useState(valoresIniciais?.hora_devolucao ?? "");
  const [localDevolucao, setLocalDevolucao] = useState(
    valoresIniciais?.local_devolucao ?? "Sede da empresa LOCAMAR LTDA",
  );
  const [observacoes, setObservacoes] = useState(valoresIniciais?.observacoes ?? "");
  const [copiado, setCopiado] = useState(false);

  const condutorNomeEfetivo = mesmoCondutor ? solicitanteNome : condutorNome;
  const condutorMatriculaEfetiva = mesmoCondutor ? solicitanteMatricula : condutorMatricula;
  const condutorCargoEfetivo = mesmoCondutor ? solicitanteCargo : condutorCargo;
  const pessoaCondutorIdEfetivo = mesmoCondutor ? pessoaSolicitanteId : pessoaCondutorId;

  function handleItemChange(id: string) {
    setItemId(id);
    if (id === "manual") {
      setVeiculoDescricao("");
      return;
    }
    const item = itens.find((i) => i.id === id);
    if (item) {
      setVeiculoDescricao(`${item.descricao}${item.faixa_km ? ` — ${item.faixa_km}` : ""}`);
      setValorDiaria(item.valor_diaria);
      setValorDiariaTexto(
        item.valor_diaria.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
      );
    }
  }

  function handleValorChange(texto: string) {
    const { texto: formatado, valor } = formatarValorDigitado(texto);
    setValorDiariaTexto(formatado);
    setValorDiaria(valor);
  }

  // Recalcula a quantidade de diárias sempre que uma das duas datas muda —
  // só sobrescreve se der um intervalo válido (> 0 dias); o campo continua
  // editável manualmente depois (ex.: cobrança combinada com a locadora
  // por um número fixo de diárias diferente do calendário corrido).
  function diasEntre(retirada: string, devolucao: string) {
    if (!retirada || !devolucao) return null;
    const d1 = new Date(`${retirada}T00:00:00`);
    const d2 = new Date(`${devolucao}T00:00:00`);
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  }

  function handleDataRetiradaChange(valor: string) {
    setDataRetirada(valor);
    const dias = diasEntre(valor, dataDevolucao);
    if (dias) setQtdDiarias(dias);
  }

  function handleDataDevolucaoChange(valor: string) {
    setDataDevolucao(valor);
    const dias = diasEntre(dataRetirada, valor);
    if (dias) setQtdDiarias(dias);
  }

  const mensagem = useMemo(
    () =>
      mensagemSolicitacaoVeiculo({
        numero: valoresIniciais?.numero || "(gerado automaticamente)",
        ano: new Date(dataPedido).getFullYear(),
        dataPedido,
        processo: "PRC011 - Pregão 003/2026",
        locadora: "LOCAMAR LTDA",
        solicitanteNome: solicitanteNome || "—",
        condutorNome: condutorNomeEfetivo || "—",
        veiculoDescricao: veiculoDescricao || "—",
        valorDiaria,
        qtdDiarias,
        dataRetirada: dataRetirada || null,
        horaRetirada: horaRetirada || null,
        localRetirada,
        dataDevolucao: dataDevolucao || null,
        horaDevolucao: horaDevolucao || null,
        localDevolucao,
        observacoes,
      }),
    [
      valoresIniciais?.numero,
      dataPedido,
      solicitanteNome,
      condutorNomeEfetivo,
      veiculoDescricao,
      valorDiaria,
      qtdDiarias,
      dataRetirada,
      horaRetirada,
      localRetirada,
      dataDevolucao,
      horaDevolucao,
      localDevolucao,
      observacoes,
    ],
  );

  async function copiarMensagem() {
    await navigator.clipboard.writeText(mensagem);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <form action={action} className="mt-6 space-y-6">
      {mesmoCondutor && (
        <>
          <input
            type="hidden"
            name="pessoa_condutor_id"
            value={pessoaCondutorIdEfetivo === "outro" ? "" : pessoaCondutorIdEfetivo}
          />
          <input type="hidden" name="condutor_nome" value={condutorNomeEfetivo} />
          <input type="hidden" name="condutor_matricula" value={condutorMatriculaEfetiva ?? ""} />
          <input type="hidden" name="condutor_cargo" value={condutorCargoEfetivo ?? ""} />
        </>
      )}
      <input type="hidden" name="item_id" value={itemId === "manual" || itemId === "" ? "" : itemId} />
      <input type="hidden" name="valor_diaria" value={valorDiaria} />
      <input type="hidden" name="processo" value="PRC011 - Pregão 003/2026" />
      <input type="hidden" name="locadora" value="LOCAMAR LTDA" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="numero" className="block text-sm font-medium text-slate-700">Número</label>
          <input
            id="numero"
            name="numero"
            defaultValue={valoresIniciais?.numero ?? ""}
            required={Boolean(valoresIniciais)}
            placeholder={valoresIniciais ? undefined : "Deixe em branco para gerar automaticamente"}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="data_pedido" className="block text-sm font-medium text-slate-700">Data do pedido</label>
          <input
            id="data_pedido"
            type="date"
            name="data_pedido"
            required
            value={dataPedido}
            onChange={(e) => setDataPedido(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700">Solicitante</h2>
        <div className="mt-2">
          <SeletorPessoa
            pessoas={pessoas}
            pessoaId={pessoaSolicitanteId}
            nome={solicitanteNome}
            matricula={solicitanteMatricula}
            cargo={solicitanteCargo}
            onChangePessoaId={setPessoaSolicitanteId}
            onChangeNome={setSolicitanteNome}
            onChangeMatricula={setSolicitanteMatricula}
            onChangeCargo={setSolicitanteCargo}
            namePrefix="solicitante"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700">Condutor</h2>
          <label className="flex items-center gap-1.5 text-xs text-slate-500">
            <input
              type="checkbox"
              checked={mesmoCondutor}
              onChange={(e) => setMesmoCondutor(e.target.checked)}
            />
            Mesmo que o solicitante
          </label>
        </div>
        {!mesmoCondutor && (
          <div className="mt-2">
            <SeletorPessoa
              pessoas={pessoas}
              pessoaId={pessoaCondutorId}
              nome={condutorNome}
              matricula={condutorMatricula}
              cargo={condutorCargo}
              onChangePessoaId={setPessoaCondutorId}
              onChangeNome={setCondutorNome}
              onChangeMatricula={setCondutorMatricula}
              onChangeCargo={setCondutorCargo}
              namePrefix="condutor"
            />
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700">Veículo (Pregão 003/2026)</h2>
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <select
            value={itemId}
            onChange={(e) => handleItemChange(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-1"
          >
            <option value="">Selecione o item…</option>
            {itens.map((i) => (
              <option key={i.id} value={i.id}>
                {i.codigo.toUpperCase()} — {i.descricao}
              </option>
            ))}
            <option value="manual">Manual (fora do catálogo)</option>
          </select>
          <input
            name="veiculo_descricao"
            value={veiculoDescricao}
            onChange={(e) => setVeiculoDescricao(e.target.value)}
            placeholder="Descrição do veículo"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:col-span-2"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:w-1/2">
          <div>
            <label htmlFor="valor_diaria_texto" className="block text-xs font-medium text-slate-500">Valor da diária (R$)</label>
            <input
              id="valor_diaria_texto"
              inputMode="numeric"
              value={valorDiariaTexto}
              onChange={(e) => handleValorChange(e.target.value)}
              placeholder="R$ 0,00"
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="qtd_diarias" className="block text-xs font-medium text-slate-500">Qtd. diárias</label>
            <input
              id="qtd_diarias"
              type="number"
              name="qtd_diarias"
              min={1}
              value={qtdDiarias}
              onChange={(e) => setQtdDiarias(Number(e.target.value) || 1)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              Calculada automaticamente pelas datas — pode ajustar.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Retirada</p>
          <div>
            <label htmlFor="data_retirada" className="block text-xs font-medium text-slate-500">Data</label>
            <input
              id="data_retirada"
              type="date"
              name="data_retirada"
              required
              value={dataRetirada}
              onChange={(e) => handleDataRetiradaChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="hora_retirada" className="block text-xs font-medium text-slate-500">Hora</label>
            <input
              id="hora_retirada"
              type="time"
              name="hora_retirada"
              value={horaRetirada}
              onChange={(e) => setHoraRetirada(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="local_retirada" className="block text-xs font-medium text-slate-500">Local</label>
            <input
              id="local_retirada"
              name="local_retirada"
              value={localRetirada}
              onChange={(e) => setLocalRetirada(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Devolução</p>
          <div>
            <label htmlFor="data_devolucao" className="block text-xs font-medium text-slate-500">Data</label>
            <input
              id="data_devolucao"
              type="date"
              name="data_devolucao"
              required
              value={dataDevolucao}
              onChange={(e) => handleDataDevolucaoChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="hora_devolucao" className="block text-xs font-medium text-slate-500">Hora</label>
            <input
              id="hora_devolucao"
              type="time"
              name="hora_devolucao"
              value={horaDevolucao}
              onChange={(e) => setHoraDevolucao(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label htmlFor="local_devolucao" className="block text-xs font-medium text-slate-500">Local</label>
            <input
              id="local_devolucao"
              name="local_devolucao"
              value={localDevolucao}
              onChange={(e) => setLocalDevolucao(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="observacoes" className="block text-sm font-medium text-slate-700">Observações (opcional)</label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={2}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase text-slate-500">Prévia da mensagem</p>
          <button
            type="button"
            onClick={copiarMensagem}
            className="text-xs font-medium text-brand-navy hover:underline"
          >
            {copiado ? "Copiado!" : "Copiar mensagem"}
          </button>
        </div>
        <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-slate-700">{mensagem}</pre>
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
