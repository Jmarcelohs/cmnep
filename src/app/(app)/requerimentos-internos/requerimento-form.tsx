"use client";

import { useMemo, useState } from "react";
import { formatarCpfDigitado, formatarValorDigitado } from "@/lib/reembolso/mascaras";
import { corpoRequerimentoInterno } from "@/lib/requerimentos-internos/documento";
import { ASSUNTOS_POR_TIPO, FUNDAMENTOS_SUGERIDOS } from "@/lib/requerimentos-internos/assuntos";
import { valorPorExtenso } from "@/lib/pdf/formato";
import type { CargoDeclarado, Categoria, TipoRequerimentoInterno } from "@/lib/supabase/database.types";

type Pessoa = { id: string; nome: string; matricula: string | null; cargo: string; categoria: Categoria; cpf: string | null };

// As 3 categorias antigas (RH, Ao Presidente, Geral) foram unificadas —
// todo requerimento novo é salvo como "presidente" (endereçado ao
// Presidente da Câmara) e usa o catálogo de assuntos correspondente, que
// já reúne os antigos assuntos de RH. Não há mais escolha de categoria
// no formulário.
const TIPO_UNIFICADO: TipoRequerimentoInterno = "presidente";
const CARGOS: CargoDeclarado[] = ["Vereador(a)", "Servidor(a)", "Estagiário(a)"];

function cargoPadrao(categoria?: Categoria): CargoDeclarado {
  return categoria === "Vereador" ? "Vereador(a)" : "Servidor(a)";
}

export type ValoresIniciaisRequerimentoInterno = {
  numero: string;
  tipo: TipoRequerimentoInterno;
  pessoa_id: string;
  nome: string;
  cargo: CargoDeclarado;
  cpf: string;
  matricula: string;
  data_requerimento: string;
  assunto_key: string;
  assuntoTitulo: string;
  fundamento: string;
  campos: Record<string, string>;
  pedido: string;
  referente_a: string;
  valor: string;
};

export function RequerimentoInternoForm({
  action,
  pessoas,
  valoresIniciais,
  submitLabel = "Gerar requerimento",
}: {
  action: (formData: FormData) => void;
  pessoas: Pessoa[];
  valoresIniciais?: ValoresIniciaisRequerimentoInterno;
  submitLabel?: string;
}) {
  const [modoCadastro, setModoCadastro] = useState(!valoresIniciais || Boolean(valoresIniciais.pessoa_id));
  const [pessoaId, setPessoaId] = useState(valoresIniciais?.pessoa_id ?? "");
  const [nome, setNome] = useState(valoresIniciais?.nome ?? "");
  const [cargo, setCargo] = useState<CargoDeclarado>(valoresIniciais?.cargo ?? "Servidor(a)");
  const [cpf, setCpf] = useState(formatarCpfDigitado(valoresIniciais?.cpf ?? ""));
  const [matricula, setMatricula] = useState(valoresIniciais?.matricula ?? "");
  const [dataRequerimento, setDataRequerimento] = useState(valoresIniciais?.data_requerimento ?? "");

  const [assuntoKey, setAssuntoKey] = useState(valoresIniciais?.assunto_key ?? "");
  const [assuntoTitulo, setAssuntoTitulo] = useState(valoresIniciais?.assuntoTitulo ?? "");
  const [fundamento, setFundamento] = useState(valoresIniciais?.fundamento ?? "");
  const [campos, setCampos] = useState<Record<string, string>>(valoresIniciais?.campos ?? {});
  const [pedido, setPedido] = useState(valoresIniciais?.pedido ?? "");
  const [referenteA, setReferenteA] = useState(valoresIniciais?.referente_a ?? "");

  const [valorTexto, setValorTexto] = useState(
    valoresIniciais?.valor
      ? Number(valoresIniciais.valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "",
  );
  const [valorNumero, setValorNumero] = useState(Number(valoresIniciais?.valor ?? 0));

  const assuntosDaCategoria = ASSUNTOS_POR_TIPO[TIPO_UNIFICADO];
  const assuntoSelecionado = assuntosDaCategoria.find((a) => a.key === assuntoKey);
  const modoEstruturado = Boolean(assuntoSelecionado?.fields?.length);
  const ehPersonalizado = assuntosDaCategoria.length > 0 && !assuntoSelecionado;

  function handlePessoaChange(id: string) {
    setPessoaId(id);
    const pessoa = pessoas.find((p) => p.id === id);
    setNome(pessoa?.nome ?? "");
    setCargo(cargoPadrao(pessoa?.categoria));
    setCpf(formatarCpfDigitado(pessoa?.cpf ?? ""));
    setMatricula(pessoa?.matricula ?? "");
  }

  function handleAssuntoChange(key: string) {
    setAssuntoKey(key);
    setCampos({});
    const assunto = assuntosDaCategoria.find((a) => a.key === key);
    if (assunto?.fundamentoFixo) {
      setFundamento(assunto.fundamentoFixo);
    } else {
      setFundamento("");
    }
  }

  function handleValorChange(texto: string) {
    const { texto: formatado, valor } = formatarValorDigitado(texto);
    setValorTexto(formatado);
    setValorNumero(valor);
  }

  const assuntoResolvido = assuntoSelecionado?.label || assuntoTitulo;

  const previa = useMemo(
    () =>
      corpoRequerimentoInterno({
        tipo: TIPO_UNIFICADO,
        assuntoKey: assuntoKey || null,
        nome: nome || "[solicitante]",
        cargo,
        cpf: cpf || null,
        matricula: matricula || null,
        fundamento: fundamento || null,
        campos,
        pedido,
      }),
    [assuntoKey, nome, cargo, cpf, matricula, fundamento, campos, pedido],
  );

  return (
    <form action={action} className="mt-6 space-y-8">
      <input type="hidden" name="tipo" value={TIPO_UNIFICADO} />
      <input type="hidden" name="pessoa_id" value={modoCadastro ? pessoaId : ""} />
      <input type="hidden" name="cpf" value={cpf} />
      <input type="hidden" name="assunto_key" value={assuntoKey} />
      <input type="hidden" name="assunto" value={assuntoResolvido} />
      <input type="hidden" name="campos" value={JSON.stringify(campos)} />
      <input type="hidden" name="valor" value={valorNumero || ""} />

      <div>
        <h2 className="text-sm font-semibold text-slate-700">1. Solicitante</h2>
        <div className="mt-2 flex gap-2 text-xs">
          <button
            type="button"
            onClick={() => setModoCadastro(true)}
            className={`rounded-full px-3 py-1 ${modoCadastro ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-600"}`}
          >
            Cadastrados
          </button>
          <button
            type="button"
            onClick={() => setModoCadastro(false)}
            className={`rounded-full px-3 py-1 ${!modoCadastro ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-600"}`}
          >
            Preencher manualmente
          </button>
        </div>

        {modoCadastro && (
          <select
            value={pessoaId}
            onChange={(e) => handlePessoaChange(e.target.value)}
            className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Selecione…</option>
            {pessoas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({p.categoria})
              </option>
            ))}
          </select>
        )}

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Nome completo (opcional)</label>
            <input
              name="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={modoCadastro && Boolean(pessoaId)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Cargo/Função</label>
            <select
              name="cargo"
              value={cargo}
              onChange={(e) => setCargo(e.target.value as CargoDeclarado)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {CARGOS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">CPF</label>
            <input
              inputMode="numeric"
              value={cpf}
              onChange={(e) => setCpf(formatarCpfDigitado(e.target.value))}
              placeholder="000.000.000-00"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Matrícula (opcional)</label>
            <input
              name="matricula"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Data do requerimento (opcional)</label>
            <input
              type="date"
              name="data_requerimento"
              value={dataRequerimento}
              onChange={(e) => setDataRequerimento(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          {valoresIniciais && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Número (opcional)</label>
              <input
                name="numero"
                defaultValue={valoresIniciais.numero}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-700">2. Detalhes do pedido</h2>

        {assuntosDaCategoria.length > 0 && (
          <div className="mt-2">
            <label className="block text-sm font-medium text-slate-700">Assunto</label>
            <select
              value={assuntoKey}
              onChange={(e) => handleAssuntoChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Personalizado</option>
              {assuntosDaCategoria.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {ehPersonalizado && (
          <div className="mt-3">
            <label className="block text-sm font-medium text-slate-700">Título do requerimento (opcional)</label>
            <input
              value={assuntoTitulo}
              onChange={(e) => setAssuntoTitulo(e.target.value)}
              placeholder="Ex.: Solicitação de crachá"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        )}

        <div className="mt-3">
          <label className="block text-sm font-medium text-slate-700">Fundamento legal (opcional)</label>
          <input
            name="fundamento"
            value={fundamento}
            onChange={(e) => setFundamento(e.target.value)}
            disabled={Boolean(assuntoSelecionado?.fundamentoFixo)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100"
          />
          {!assuntoSelecionado?.fundamentoFixo && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {FUNDAMENTOS_SUGERIDOS[TIPO_UNIFICADO].map((sugestao) => (
                <button
                  key={sugestao}
                  type="button"
                  onClick={() => setFundamento(sugestao)}
                  className="rounded-full border border-slate-300 px-2 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
                >
                  {sugestao}
                </button>
              ))}
            </div>
          )}
        </div>

        {modoEstruturado ? (
          <div className="mt-4 space-y-3">
            {assuntoSelecionado!.fields!.map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-slate-700">{f.label} (opcional)</label>
                {f.type === "select" ? (
                  <select
                    value={campos[f.key] ?? ""}
                    onChange={(e) => setCampos((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">Selecione…</option>
                    {f.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type === "date" ? "date" : "text"}
                    value={campos[f.key] ?? ""}
                    onChange={(e) => setCampos((prev) => ({ ...prev, [f.key]: e.target.value }))}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700">Descrição do pedido (opcional)</label>
              <textarea
                name="pedido"
                rows={4}
                value={pedido}
                onChange={(e) => setPedido(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Referente à (opcional)</label>
              <textarea
                name="referente_a"
                rows={2}
                value={referenteA}
                onChange={(e) => setReferenteA(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Valor (opcional)</label>
            <input
              inputMode="numeric"
              value={valorTexto}
              onChange={(e) => handleValorChange(e.target.value)}
              placeholder="R$ 0,00"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          {valorNumero > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700">Valor por extenso</label>
              <p className="mt-1 rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-700">
                {valorPorExtenso(valorNumero)}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Prévia do requerimento</p>
        <p className="mt-2 text-sm font-medium text-slate-700">{assuntoResolvido || "—"}</p>
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
