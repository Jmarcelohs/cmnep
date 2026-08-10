"use client";

import { useMemo, useState } from "react";
import {
  aberturaCongratulacaoSegmentos,
  aberturaPesarSegmentos,
  associadosComPresidenteObrigatorio,
  enderecamentoPesarSegmentos,
  fechoMocao,
  LABEL_TIPO_MOCAO,
  legendaAssinatura,
  ordenarSignatarios,
  PARAGRAFOS_PESAR_FIXOS,
  TIPOS_MOCAO_DISPONIVEIS,
  type VereadorSignatario,
} from "@/lib/mocoes/documento";
import type { TipoMocao, Tratamento } from "@/lib/supabase/database.types";

export type VereadorOpcao = {
  id: string;
  nome: string;
  partido: string | null;
  genero: "Vereador" | "Vereadora";
  presidente: boolean;
};

export type ValoresIniciaisMocao = {
  tipo: TipoMocao;
  data_mocao: string;
  destinatario: string;
  destinatario_tratamento: Tratamento;
  autor_vereador_id: string;
  associados_vereadores_ids: string[];
  justificativa: string;
};

function SegmentosPrevia({ segmentos }: { segmentos: { texto: string; negrito: boolean }[] }) {
  return (
    <>
      {segmentos.map((s, i) =>
        s.negrito ? <strong key={i}>{s.texto}</strong> : <span key={i}>{s.texto}</span>,
      )}
    </>
  );
}

export function MocaoForm({
  action,
  vereadores,
  valoresIniciais,
  submitLabel = "Salvar moção",
}: {
  action: (formData: FormData) => void;
  vereadores: VereadorOpcao[];
  valoresIniciais?: ValoresIniciaisMocao;
  submitLabel?: string;
}) {
  const [tipo, setTipo] = useState<TipoMocao>(
    valoresIniciais?.tipo ?? TIPOS_MOCAO_DISPONIVEIS[0],
  );
  const [dataMocao, setDataMocao] = useState(valoresIniciais?.data_mocao ?? "");
  const [destinatario, setDestinatario] = useState(valoresIniciais?.destinatario ?? "");
  const [destinatarioTratamento, setDestinatarioTratamento] = useState<Tratamento>(
    valoresIniciais?.destinatario_tratamento ?? "Sr.",
  );
  const [autorId, setAutorId] = useState(valoresIniciais?.autor_vereador_id ?? "");
  const [associadosIds, setAssociadosIds] = useState<Set<string>>(
    new Set(valoresIniciais?.associados_vereadores_ids ?? []),
  );
  const [justificativa, setJustificativa] = useState(valoresIniciais?.justificativa ?? "");

  const autor = vereadores.find((v) => v.id === autorId);
  const associadosSelecionados = vereadores.filter(
    (v) => associadosIds.has(v.id) && v.id !== autorId,
  );

  function paraSignatario(v: VereadorOpcao): VereadorSignatario {
    return {
      id: v.id,
      nome: v.nome,
      partido: v.partido,
      genero: v.genero,
      presidente: v.presidente,
      assinaturaCaminho: null,
    };
  }

  // O Presidente assina toda moção por exigência do Regimento Interno,
  // mesmo que não tenha sido marcado como autor/associado — a prévia
  // reflete isso pra nunca divergir do PDF final (ver imprimir/page.tsx).
  const presidenteVereador = vereadores.find((v) => v.presidente);
  const associados = autor
    ? associadosComPresidenteObrigatorio(
        autor,
        associadosSelecionados.map(paraSignatario),
        presidenteVereador ? paraSignatario(presidenteVereador) : null,
      )
    : associadosSelecionados.map(paraSignatario);

  function alternarAssociado(id: string) {
    setAssociadosIds((atual) => {
      const novo = new Set(atual);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }

  const segmentosAbertura = useMemo(() => {
    if (tipo === "pesar") {
      return aberturaPesarSegmentos({
        autorNome: autor?.nome ?? "",
        autorGenero: autor?.genero ?? "Vereador",
        associadosNomes: associados.map((v) => v.nome),
        destinatarioNome: destinatario,
        destinatarioTratamento,
      });
    }
    return aberturaCongratulacaoSegmentos({
      autorNome: autor?.nome ?? "",
      associadosNomes: associados.map((v) => v.nome),
    });
  }, [tipo, autor, associados, destinatario, destinatarioTratamento]);

  const signatarios = useMemo(() => {
    const todos = autor ? [paraSignatario(autor), ...associados] : associados;
    return ordenarSignatarios(todos);
  }, [autor, associados]);

  return (
    <form action={action} className="mt-6 space-y-6">
      <input type="hidden" name="associados_vereadores_ids" value={JSON.stringify([...associadosIds])} />

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label htmlFor="destinatario" className="block text-sm font-medium text-slate-700">
            {tipo === "pesar" ? "Nome do(a) falecido(a)" : "Destinatário (pessoa, entidade, órgão etc.)"}
          </label>
          <input
            id="destinatario"
            name="destinatario"
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        {tipo === "pesar" && (
          <div>
            <label htmlFor="destinatario_tratamento" className="block text-sm font-medium text-slate-700">
              Tratamento
            </label>
            <select
              id="destinatario_tratamento"
              name="destinatario_tratamento"
              value={destinatarioTratamento}
              onChange={(e) => setDestinatarioTratamento(e.target.value as Tratamento)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="Sr.">Sr.</option>
              <option value="Sra.">Sra.</option>
            </select>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="autor_vereador_id" className="block text-sm font-medium text-slate-700">
          Autor (vereador requerente)
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
          Vereadores associados (opcional)
        </label>
        <p className="mt-1 text-xs text-slate-500">
          O Presidente assina automaticamente todas as moções (art. 117 do Regimento Interno) —
          não precisa marcá-lo aqui.
        </p>
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
      )}
      {tipo === "pesar" && (
        <p className="rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-500">
          O texto de pêsames é padronizado (ver prévia abaixo) — não há campo de justificativa
          pra esse tipo.
        </p>
      )}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Prévia do texto padronizado</p>
        <div className="mt-2 space-y-2 text-sm text-slate-700">
          {tipo === "pesar" && (
            <p>
              <SegmentosPrevia
                segmentos={enderecamentoPesarSegmentos({
                  destinatarioNome: destinatario,
                  destinatarioTratamento,
                })}
              />
            </p>
          )}
          <p>
            <SegmentosPrevia segmentos={segmentosAbertura} />
          </p>
          {tipo === "congratulacoes" && (
            <p className="text-center font-semibold">{destinatario.toUpperCase() || "[destinatário]"}</p>
          )}
          {tipo === "pesar"
            ? PARAGRAFOS_PESAR_FIXOS.map((p, i) => <p key={i}>{p}</p>)
            : justificativa
                .split(/\n+/)
                .map((p) => p.trim())
                .filter(Boolean)
                .map((p, i) => <p key={i}>{p}</p>)}
          <p className="text-right">{fechoMocao(dataMocao)}</p>
          <p className="mt-4 text-xs text-slate-500">
            Assinam, em ordem: {signatarios.map((s) => `${s.nome} (${legendaAssinatura(s)})`).join("; ") || "—"}
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
