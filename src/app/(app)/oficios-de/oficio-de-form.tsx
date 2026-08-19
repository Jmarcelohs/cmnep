"use client";

import { useState } from "react";
import {
  DIRETOR_EXECUTIVO_CARGO,
  DIRETOR_EXECUTIVO_NOME,
  SUGESTOES_TRATAMENTO_DE,
  numeroOficioDEFormatado,
  saudacaoSugeridaDE,
} from "@/lib/oficios-de/documento";
import { RichTextEditor } from "@/components/rich-text-editor";

export type ValoresIniciaisOficioDE = {
  numero: string;
  data_oficio: string;
  destinatario_tratamento: string;
  destinatario_nome: string;
  destinatario_cargo: string;
  destinatario_cidade_uf: string;
  saudacao: string;
  assunto: string;
  corpo_texto: string;
};

export function OficioDEForm({
  action,
  valoresIniciais,
  submitLabel = "Salvar ofício",
}: {
  action: (formData: FormData) => void;
  valoresIniciais?: ValoresIniciaisOficioDE;
  submitLabel?: string;
}) {
  const [numero, setNumero] = useState(valoresIniciais?.numero ?? "");
  const [dataOficio, setDataOficio] = useState(valoresIniciais?.data_oficio ?? "");
  const [tratamento, setTratamento] = useState(
    valoresIniciais?.destinatario_tratamento ?? "Ilmo. Sr.",
  );
  const [destinatarioNome, setDestinatarioNome] = useState(valoresIniciais?.destinatario_nome ?? "");
  const [destinatarioCargo, setDestinatarioCargo] = useState(
    valoresIniciais?.destinatario_cargo ?? "",
  );
  const [destinatarioCidadeUf, setDestinatarioCidadeUf] = useState(
    valoresIniciais?.destinatario_cidade_uf ?? "",
  );
  const [saudacao, setSaudacao] = useState(valoresIniciais?.saudacao ?? "");
  const [saudacaoTocada, setSaudacaoTocada] = useState(Boolean(valoresIniciais?.saudacao));
  const [assunto, setAssunto] = useState(valoresIniciais?.assunto ?? "");
  const [corpoTexto, setCorpoTexto] = useState(valoresIniciais?.corpo_texto ?? "");

  const saudacaoExibida = saudacaoTocada
    ? saudacao
    : saudacaoSugeridaDE(tratamento, destinatarioCargo);

  const ano = dataOficio ? new Date(dataOficio).getFullYear() : new Date().getFullYear();

  return (
    <form action={action} className="mt-6 space-y-6">
      {/* Saudação sugerida só vira campo definitivo quando o redator mexe
          nela — senão manda a sugestão calculada na hora do submit (mesma
          convenção do Ofício da Secretaria). */}
      <input type="hidden" name="saudacao" value={saudacaoExibida} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="numero" className="block text-sm font-medium text-slate-700">Número</label>
          <input
            id="numero"
            name="numero"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="data_oficio" className="block text-sm font-medium text-slate-700">Data</label>
          <input
            id="data_oficio"
            type="date"
            name="data_oficio"
            required
            value={dataOficio}
            onChange={(e) => setDataOficio(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 p-4">
        <p className="text-sm font-semibold text-slate-700">Destinatário</p>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="destinatario_tratamento" className="block text-sm font-medium text-slate-700">
              Tratamento (opcional)
            </label>
            <input
              id="destinatario_tratamento"
              name="destinatario_tratamento"
              list="lista-tratamentos-de"
              value={tratamento}
              onChange={(e) => setTratamento(e.target.value)}
              placeholder="Ex.: Ilmo. Sr."
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <datalist id="lista-tratamentos-de">
              {SUGESTOES_TRATAMENTO_DE.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <p className="mt-1 text-xs text-slate-500">
              {tratamento.trim()
                ? `No ofício sai: "Ao ${tratamento}"`
                : "Deixe em branco pra endereçar a um setor/departamento, sem tratamento de pessoa."}
            </p>
          </div>
          <div>
            <label htmlFor="destinatario_nome" className="block text-sm font-medium text-slate-700">
              Nome (pessoa ou setor)
            </label>
            <input
              id="destinatario_nome"
              name="destinatario_nome"
              value={destinatarioNome}
              onChange={(e) => setDestinatarioNome(e.target.value)}
              required
              placeholder="Ex.: Bruno Henrique de Carvalho Marangoni ou Departamento de Arrecadação"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="destinatario_cargo" className="block text-sm font-medium text-slate-700">
              Cargo (opcional)
            </label>
            <input
              id="destinatario_cargo"
              name="destinatario_cargo"
              value={destinatarioCargo}
              onChange={(e) => setDestinatarioCargo(e.target.value)}
              placeholder="Ex.: Controlador Geral do Município"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="destinatario_cidade_uf" className="block text-sm font-medium text-slate-700">
              Cidade/UF (opcional)
            </label>
            <input
              id="destinatario_cidade_uf"
              name="destinatario_cidade_uf"
              value={destinatarioCidadeUf}
              onChange={(e) => setDestinatarioCidadeUf(e.target.value)}
              placeholder="Ex.: Nepomuceno/MG"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-3">
          <label htmlFor="saudacao_exibida" className="block text-sm font-medium text-slate-700">
            Saudação
          </label>
          <input
            id="saudacao_exibida"
            value={saudacaoExibida}
            onChange={(e) => {
              setSaudacaoTocada(true);
              setSaudacao(e.target.value);
            }}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="assunto" className="block text-sm font-medium text-slate-700">Assunto</label>
        <input
          id="assunto"
          name="assunto"
          value={assunto}
          onChange={(e) => setAssunto(e.target.value)}
          required
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="corpo_texto" className="block text-sm font-medium text-slate-700">
          Texto do ofício
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Use a barra de ferramentas pra negrito, itálico, sublinhado e listas.
        </p>
        <div className="mt-1">
          <RichTextEditor
            name="corpo_texto"
            value={corpoTexto}
            onChange={setCorpoTexto}
            margemEsquerdaMm={30}
            margemDireitaMm={30}
          />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Prévia do texto</p>
        <div className="mt-2 space-y-2 text-sm text-slate-700">
          <p className="font-semibold">{numeroOficioDEFormatado({ numero: numero || "—", ano })}</p>
          <p>
            {destinatarioNome &&
              `${tratamento.trim() ? `Ao ${tratamento} ` : "Ao "}${destinatarioNome}${destinatarioCargo ? `, ${destinatarioCargo}` : ""}`}
          </p>
          <p>{assunto && `Assunto: ${assunto}`}</p>
          <p>{saudacaoExibida}</p>
          <div
            className="space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: corpoTexto || "<p>…</p>" }}
          />
          <p>Atenciosamente.</p>
          <p className="pt-2 font-semibold">{DIRETOR_EXECUTIVO_NOME}</p>
          <p className="text-xs text-slate-500">{DIRETOR_EXECUTIVO_CARGO}</p>
        </div>
      </div>

      <div>
        <button
          type="submit"
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
