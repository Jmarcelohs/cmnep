"use client";

import { useMemo, useState } from "react";
import { formatarCpfDigitado, formatarValorDigitado } from "@/lib/reembolso/mascaras";
import { corpoReembolso, buildReferenteA, SUBASSUNTO_TITULO } from "@/lib/reembolso/documento";
import type { CargoDeclarado, Categoria, SubassuntoReembolso } from "@/lib/supabase/database.types";

type Pessoa = { id: string; nome: string; cargo: string; categoria: Categoria; cpf: string | null };
type Diaria = { id: string; pessoa_id: string; numero_diaria: string | null; municipio_destino: string | null };
type VeiculoLocacao = { id: string; numero: string; ano: number; veiculo_descricao: string };

const SUBASSUNTOS: SubassuntoReembolso[] = [
  "locomocao",
  "combustivel",
  "passagem_aerea",
  "passagem_onibus",
];

const CARGOS_DECLARADOS: CargoDeclarado[] = ["Vereador(a)", "Servidor(a)", "Estagiário(a)"];

function cargoDeclaradoPadrao(categoria?: Categoria): CargoDeclarado {
  return categoria === "Vereador" ? "Vereador(a)" : "Servidor(a)";
}

export type ValoresIniciaisReembolso = {
  protocolo: string;
  pessoa_id: string;
  cargo_declarado: CargoDeclarado;
  cpf: string;
  subassunto: SubassuntoReembolso;
  data_requerimento: string;
  data_ida: string;
  data_volta: string;
  municipio: string;
  valor: number;
  solicitacao_diaria_id: string;
  solicitacao_veiculo_id: string;
  placa_veiculo: string;
  modelo_veiculo: string;
};

export function ReembolsoForm({
  action,
  pessoas,
  diarias,
  veiculos,
  pessoaFixaId,
  valoresIniciais,
  submitLabel = "Enviar requerimento",
}: {
  action: (formData: FormData) => void;
  pessoas: Pessoa[];
  diarias: Diaria[];
  veiculos: VeiculoLocacao[];
  pessoaFixaId?: string;
  valoresIniciais?: ValoresIniciaisReembolso;
  submitLabel?: string;
}) {
  const [pessoaId, setPessoaId] = useState(pessoaFixaId ?? valoresIniciais?.pessoa_id ?? "");
  const pessoaSelecionada = pessoas.find((p) => p.id === pessoaId);

  const [cargoDeclarado, setCargoDeclarado] = useState<CargoDeclarado>(
    valoresIniciais?.cargo_declarado ?? cargoDeclaradoPadrao(pessoaSelecionada?.categoria),
  );
  const [subassunto, setSubassunto] = useState<SubassuntoReembolso>(
    valoresIniciais?.subassunto ?? "locomocao",
  );
  const [cpf, setCpf] = useState(
    formatarCpfDigitado(valoresIniciais?.cpf ?? pessoaSelecionada?.cpf ?? ""),
  );
  const [dataIda, setDataIda] = useState(valoresIniciais?.data_ida ?? "");
  const [dataVolta, setDataVolta] = useState(valoresIniciais?.data_volta ?? "");
  const [municipio, setMunicipio] = useState(valoresIniciais?.municipio ?? "");
  const [solicitacaoDiariaId, setSolicitacaoDiariaId] = useState(
    valoresIniciais?.solicitacao_diaria_id ?? "",
  );
  const [solicitacaoVeiculoId, setSolicitacaoVeiculoId] = useState(
    valoresIniciais?.solicitacao_veiculo_id ?? "",
  );
  const [placaVeiculo, setPlacaVeiculo] = useState(valoresIniciais?.placa_veiculo ?? "");
  const [modeloVeiculo, setModeloVeiculo] = useState(valoresIniciais?.modelo_veiculo ?? "");

  const valorInicialTexto = valoresIniciais?.valor
    ? valoresIniciais.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "";
  const [valorTexto, setValorTexto] = useState(valorInicialTexto);
  const [valorNumero, setValorNumero] = useState(valoresIniciais?.valor ?? 0);

  const diariasDaPessoa = useMemo(
    () => diarias.filter((d) => d.pessoa_id === pessoaId),
    [diarias, pessoaId],
  );

  function handlePessoaChange(id: string) {
    setPessoaId(id);
    const pessoa = pessoas.find((p) => p.id === id);
    setCargoDeclarado(cargoDeclaradoPadrao(pessoa?.categoria));
    setCpf(formatarCpfDigitado(pessoa?.cpf ?? ""));
    setSolicitacaoDiariaId("");
  }

  function handleValorChange(texto: string) {
    const { texto: formatado, valor } = formatarValorDigitado(texto);
    setValorTexto(formatado);
    setValorNumero(valor);
  }

  const previa = corpoReembolso({
    nome: pessoaSelecionada?.nome ?? "",
    cargoDeclarado,
    cpf: cpf || null,
    subassunto,
    dataIda: dataIda || null,
    dataVolta: dataVolta || null,
    municipio,
    valor: valorNumero,
    placaVeiculo,
    modeloVeiculo,
  });

  return (
    <form action={action} className="mt-6 space-y-6">
      <input type="hidden" name="valor" value={valorNumero} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="protocolo" className="block text-sm font-medium text-slate-700">Protocolo</label>
          <input
            id="protocolo"
            name="protocolo"
            required
            defaultValue={valoresIniciais?.protocolo ?? ""}
            placeholder="ex.: 004/2026"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            Preenchimento manual — a geração automática está desativada durante os testes.
          </p>
        </div>

        <div>
          <label htmlFor="data_requerimento" className="block text-sm font-medium text-slate-700">Data do requerimento</label>
          <input
            id="data_requerimento"
            type="date"
            name="data_requerimento"
            required
            defaultValue={valoresIniciais?.data_requerimento ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="pessoa_id" className="block text-sm font-medium text-slate-700">Solicitante</label>
          {pessoaFixaId ? (
            <>
              <input type="hidden" name="pessoa_id" value={pessoaFixaId} />
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
              onChange={(e) => handlePessoaChange(e.target.value)}
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
          {pessoaSelecionada && (
            <p className="mt-1 text-xs text-slate-500">{pessoaSelecionada.cargo}</p>
          )}
        </div>

        <div>
          <label htmlFor="cpf" className="block text-sm font-medium text-slate-700">CPF do solicitante</label>
          <input
            id="cpf"
            name="cpf"
            inputMode="numeric"
            value={cpf}
            onChange={(e) => setCpf(formatarCpfDigitado(e.target.value))}
            placeholder="000.000.000-00"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-500">
            Preenchido do cadastro da pessoa — ajuste aqui se estiver errado ou não cadastrado.
          </p>
        </div>

        <div>
          <label htmlFor="cargo_declarado" className="block text-sm font-medium text-slate-700">Cargo declarado</label>
          <select
            id="cargo_declarado"
            name="cargo_declarado"
            required
            value={cargoDeclarado}
            onChange={(e) => setCargoDeclarado(e.target.value as CargoDeclarado)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {CARGOS_DECLARADOS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subassunto" className="block text-sm font-medium text-slate-700">Sub-assunto</label>
          <select
            id="subassunto"
            name="subassunto"
            required
            value={subassunto}
            onChange={(e) => setSubassunto(e.target.value as SubassuntoReembolso)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {SUBASSUNTOS.map((s) => (
              <option key={s} value={s}>
                {SUBASSUNTO_TITULO[s]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="valor_texto" className="block text-sm font-medium text-slate-700">Valor (R$)</label>
          <input
            id="valor_texto"
            inputMode="numeric"
            value={valorTexto}
            onChange={(e) => handleValorChange(e.target.value)}
            placeholder="R$ 0,00"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="data_ida" className="block text-sm font-medium text-slate-700">Data de ida</label>
          <input
            id="data_ida"
            type="date"
            name="data_ida"
            required
            value={dataIda}
            onChange={(e) => setDataIda(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="data_volta" className="block text-sm font-medium text-slate-700">Data de volta</label>
          <input
            id="data_volta"
            type="date"
            name="data_volta"
            required
            value={dataVolta}
            onChange={(e) => setDataVolta(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="municipio" className="block text-sm font-medium text-slate-700">Município</label>
          <input
            id="municipio"
            name="municipio"
            required
            value={municipio}
            onChange={(e) => setMunicipio(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="solicitacao_diaria_id" className="block text-sm font-medium text-slate-700">
            Vincular a uma diária de viagem (opcional)
          </label>
          <select
            id="solicitacao_diaria_id"
            name="solicitacao_diaria_id"
            value={solicitacaoDiariaId}
            onChange={(e) => setSolicitacaoDiariaId(e.target.value)}
            disabled={!pessoaId}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          >
            <option value="">Nenhuma</option>
            {diariasDaPessoa.map((d) => (
              <option key={d.id} value={d.id}>
                Diária {d.numero_diaria ?? "s/ nº"} — {d.municipio_destino ?? "—"}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-500">
            Se autorizado, o valor entra automaticamente no demonstrativo financeiro (Anexo II)
            dessa diária ao prestar contas.
          </p>
        </div>

        {subassunto === "combustivel" && (
          <>
            <div className="sm:col-span-2">
              <label htmlFor="solicitacao_veiculo_id" className="block text-sm font-medium text-slate-700">
                Vincular a uma locação de veículo (opcional)
              </label>
              <select
                id="solicitacao_veiculo_id"
                name="solicitacao_veiculo_id"
                value={solicitacaoVeiculoId}
                onChange={(e) => setSolicitacaoVeiculoId(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Nenhuma</option>
                {veiculos.map((v) => (
                  <option key={v.id} value={v.id}>
                    Locação {v.numero}/{v.ano} — {v.veiculo_descricao}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-slate-500">
                Só pra referência/rastreabilidade — não altera nenhum valor automaticamente.
              </p>
            </div>

            <div>
              <label htmlFor="placa_veiculo" className="block text-sm font-medium text-slate-700">Placa do veículo</label>
              <input
                id="placa_veiculo"
                name="placa_veiculo"
                required
                value={placaVeiculo}
                onChange={(e) => setPlacaVeiculo(e.target.value.toUpperCase())}
                placeholder="ABC-1234"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm uppercase"
              />
            </div>

            <div>
              <label htmlFor="modelo_veiculo" className="block text-sm font-medium text-slate-700">Modelo do veículo</label>
              <input
                id="modelo_veiculo"
                name="modelo_veiculo"
                required
                value={modeloVeiculo}
                onChange={(e) => setModeloVeiculo(e.target.value)}
                placeholder="Ex.: Fiat Uno"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Prévia do requerimento</p>
        <p className="mt-2 text-sm font-medium text-slate-700">{buildReferenteA(subassunto)}</p>
        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{previa}</p>
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
