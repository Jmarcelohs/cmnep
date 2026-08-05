"use client";

import { useMemo, useState } from "react";
import {
  aberturaOficio,
  fraseEventoConvite,
  injetarAberturaHtml,
  numeroOficioFormatado,
  PARAGRAFO_FECHAMENTO_PADRAO,
  saudacaoSugerida,
  SIGNATARIO_OFICIO,
  TIPO_ADMITE_AUTOR_ASSOCIADO,
  TIPO_EXIGE_AUTOR,
  TIPO_OFICIO_LABEL,
} from "@/lib/oficios/documento";
import { RichTextEditor } from "@/components/rich-text-editor";
import type { GeneroVereador, TipoOficio, TratamentoOficio } from "@/lib/supabase/database.types";

export type ValoresIniciaisOficio = {
  tipo: TipoOficio;
  numero: string;
  data_oficio: string;
  destinatario_tratamento: TratamentoOficio;
  destinatario_nome: string;
  destinatario_cargo: string;
  destinatario_cidade_uf: string;
  saudacao: string;
  assunto: string;
  autor_nome: string;
  autor_genero: GeneroVereador;
  autor_associado_nome: string;
  autor_associado_genero: GeneroVereador;
  corpo_texto: string;
  evento_data: string;
  evento_hora: string;
  evento_local: string;
  paragrafo_fechamento: string;
};

const TIPOS: TipoOficio[] = ["padrao", "indicacao", "requerimento", "convite"];

export type AutoridadeQuickPick = {
  tratamento: TratamentoOficio;
  nome: string;
  cargo: string;
  cidade_uf: string | null;
};

export function OficioForm({
  action,
  valoresIniciais,
  nomesVereadores,
  autoridades = [],
  submitLabel = "Salvar ofício",
}: {
  action: (formData: FormData) => void;
  valoresIniciais?: ValoresIniciaisOficio;
  nomesVereadores: string[];
  autoridades?: AutoridadeQuickPick[];
  submitLabel?: string;
}) {
  const [tipo, setTipo] = useState<TipoOficio>(valoresIniciais?.tipo ?? "padrao");
  const [numero, setNumero] = useState(valoresIniciais?.numero ?? "");
  const [dataOficio, setDataOficio] = useState(valoresIniciais?.data_oficio ?? "");
  const [tratamento, setTratamento] = useState<TratamentoOficio>(
    valoresIniciais?.destinatario_tratamento ?? "Excelentíssimo Senhor",
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
  const [autorNome, setAutorNome] = useState(valoresIniciais?.autor_nome ?? "");
  const [autorGenero, setAutorGenero] = useState<GeneroVereador>(
    valoresIniciais?.autor_genero ?? "Vereador",
  );
  const [autorAssociadoNome, setAutorAssociadoNome] = useState(
    valoresIniciais?.autor_associado_nome ?? "",
  );
  const [autorAssociadoGenero, setAutorAssociadoGenero] = useState<GeneroVereador>(
    valoresIniciais?.autor_associado_genero ?? "Vereador",
  );
  const [corpoTexto, setCorpoTexto] = useState(valoresIniciais?.corpo_texto ?? "");
  const [eventoData, setEventoData] = useState(valoresIniciais?.evento_data ?? "");
  const [eventoHora, setEventoHora] = useState(valoresIniciais?.evento_hora ?? "");
  const [eventoLocal, setEventoLocal] = useState(valoresIniciais?.evento_local ?? "");
  const [paragrafoFechamento, setParagrafoFechamento] = useState(
    valoresIniciais?.paragrafo_fechamento || PARAGRAFO_FECHAMENTO_PADRAO,
  );

  const exigeAutor = TIPO_EXIGE_AUTOR[tipo];
  const admiteAssociado = TIPO_ADMITE_AUTOR_ASSOCIADO[tipo];
  const admiteAutor = tipo !== "convite";
  const ehConvite = tipo === "convite";

  const saudacaoExibida = saudacaoTocada ? saudacao : saudacaoSugerida(tratamento, destinatarioCargo);

  const abertura = useMemo(
    () =>
      aberturaOficio({
        tipo,
        autorNome: admiteAutor ? autorNome : null,
        autorGenero,
        autorAssociadoNome: admiteAssociado ? autorAssociadoNome : null,
        autorAssociadoGenero,
      }),
    [tipo, admiteAutor, autorNome, autorGenero, admiteAssociado, autorAssociadoNome, autorAssociadoGenero],
  );

  const fraseEvento = ehConvite
    ? fraseEventoConvite({ eventoData, eventoHora, eventoLocal })
    : null;

  return (
    <form action={action} className="mt-6 space-y-6">
      {/* Saudação sugerida só vira campo definitivo quando o redator mexe
          nela — senão manda a sugestão calculada na hora do submit. */}
      <input type="hidden" name="saudacao" value={saudacaoExibida} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="tipo" className="block text-sm font-medium text-slate-700">Tipo de ofício</label>
          <select
            id="tipo"
            name="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoOficio)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {TIPOS.map((t) => (
              <option key={t} value={t}>
                {TIPO_OFICIO_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="numero" className="block text-sm font-medium text-slate-700">Número</label>
          <input
            id="numero"
            name="numero"
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            required
            placeholder="Confira o último ofício emitido"
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

        {autoridades.length > 0 && (
          <div className="mt-3">
            <label htmlFor="autoridade_rapida" className="block text-sm font-medium text-slate-700">
              Preencher com autoridade cadastrada
            </label>
            <select
              id="autoridade_rapida"
              defaultValue=""
              onChange={(e) => {
                const autoridade = autoridades[Number(e.target.value)];
                if (!autoridade) return;
                setTratamento(autoridade.tratamento);
                setDestinatarioNome(autoridade.nome);
                setDestinatarioCargo(autoridade.cargo);
                setDestinatarioCidadeUf(autoridade.cidade_uf ?? "");
                setSaudacaoTocada(false);
                e.target.value = "";
              }}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="" disabled>
                Selecione…
              </option>
              {autoridades.map((a, i) => (
                <option key={`${a.nome}-${a.cargo}`} value={i}>
                  {a.nome} — {a.cargo}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="destinatario_tratamento" className="block text-sm font-medium text-slate-700">
              Tratamento
            </label>
            <select
              id="destinatario_tratamento"
              name="destinatario_tratamento"
              value={tratamento}
              onChange={(e) => setTratamento(e.target.value as TratamentoOficio)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="Excelentíssimo Senhor">Excelentíssimo Senhor</option>
              <option value="Excelentíssima Senhora">Excelentíssima Senhora</option>
            </select>
          </div>
          <div>
            <label htmlFor="destinatario_nome" className="block text-sm font-medium text-slate-700">Nome</label>
            <input
              id="destinatario_nome"
              name="destinatario_nome"
              value={destinatarioNome}
              onChange={(e) => setDestinatarioNome(e.target.value)}
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="destinatario_cargo" className="block text-sm font-medium text-slate-700">
              Cargo
            </label>
            <input
              id="destinatario_cargo"
              name="destinatario_cargo"
              value={destinatarioCargo}
              onChange={(e) => setDestinatarioCargo(e.target.value)}
              required
              placeholder="Ex.: Prefeito Municipal de Nepomuceno"
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

      {admiteAutor && (
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-700">
            Autor {exigeAutor ? "" : "(opcional)"}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label htmlFor="autor_nome" className="block text-sm font-medium text-slate-700">
                Vereador(a) proponente
              </label>
              <input
                id="autor_nome"
                name="autor_nome"
                list="lista-vereadores"
                value={autorNome}
                onChange={(e) => setAutorNome(e.target.value)}
                required={exigeAutor}
                placeholder="Nome do vereador (ou do Presidente)"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="autor_genero" className="block text-sm font-medium text-slate-700">Gênero</label>
              <select
                id="autor_genero"
                name="autor_genero"
                value={autorGenero}
                onChange={(e) => setAutorGenero(e.target.value as GeneroVereador)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="Vereador">Vereador</option>
                <option value="Vereadora">Vereadora</option>
              </select>
            </div>
          </div>

          {admiteAssociado && (
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label htmlFor="autor_associado_nome" className="block text-sm font-medium text-slate-700">
                  Vereador(a) associado (opcional)
                </label>
                <input
                  id="autor_associado_nome"
                  name="autor_associado_nome"
                  list="lista-vereadores"
                  value={autorAssociadoNome}
                  onChange={(e) => setAutorAssociadoNome(e.target.value)}
                  placeholder="Nome do segundo proponente, se houver"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label htmlFor="autor_associado_genero" className="block text-sm font-medium text-slate-700">
                  Gênero
                </label>
                <select
                  id="autor_associado_genero"
                  name="autor_associado_genero"
                  value={autorAssociadoGenero}
                  onChange={(e) => setAutorAssociadoGenero(e.target.value as GeneroVereador)}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Vereador">Vereador</option>
                  <option value="Vereadora">Vereadora</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      <datalist id="lista-vereadores">
        {nomesVereadores.map((nome) => (
          <option key={nome} value={nome} />
        ))}
      </datalist>

      <div>
        <label htmlFor="corpo_texto" className="block text-sm font-medium text-slate-700">
          Texto do ofício
        </label>
        <p className="mt-1 text-xs text-slate-500">
          Continue direto a frase mostrada na prévia abaixo. Use a barra de ferramentas pra negrito,
          itálico, sublinhado e listas.
        </p>
        <div className="mt-1">
          <RichTextEditor name="corpo_texto" value={corpoTexto} onChange={setCorpoTexto} />
        </div>
      </div>

      {ehConvite && (
        <div className="rounded-lg border border-slate-200 p-4">
          <p className="text-sm font-semibold text-slate-700">Dados do evento</p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="evento_data" className="block text-sm font-medium text-slate-700">Data</label>
              <input
                id="evento_data"
                type="date"
                name="evento_data"
                value={eventoData}
                onChange={(e) => setEventoData(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="evento_hora" className="block text-sm font-medium text-slate-700">Hora</label>
              <input
                id="evento_hora"
                name="evento_hora"
                value={eventoHora}
                onChange={(e) => setEventoHora(e.target.value)}
                placeholder="Ex.: 18h00"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="evento_local" className="block text-sm font-medium text-slate-700">Local</label>
              <input
                id="evento_local"
                name="evento_local"
                value={eventoLocal}
                onChange={(e) => setEventoLocal(e.target.value)}
                placeholder="Ex.: Plenário da Câmara Municipal de Nepomuceno"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <label htmlFor="paragrafo_fechamento" className="block text-sm font-medium text-slate-700">
          Parágrafo de fechamento
        </label>
        <textarea
          id="paragrafo_fechamento"
          name="paragrafo_fechamento"
          rows={2}
          value={paragrafoFechamento}
          onChange={(e) => setParagrafoFechamento(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase text-slate-500">Prévia do texto</p>
        <div className="mt-2 space-y-2 text-sm text-slate-700">
          <p className="font-semibold">{numeroOficioFormatado({ numero: numero || "—", ano: dataOficio ? new Date(dataOficio).getFullYear() : new Date().getFullYear() })}</p>
          <p>{destinatarioCargo && `Ao ${tratamento} ${destinatarioNome || "—"}, ${destinatarioCargo}`}</p>
          <p>{assunto && `Assunto: ${assunto}`}</p>
          <p>{saudacaoExibida}</p>
          <div
            className="space-y-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{
              __html: injetarAberturaHtml(abertura, corpoTexto || "<p>…</p>"),
            }}
          />
          {fraseEvento && <p>{fraseEvento}</p>}
          <p>{paragrafoFechamento}</p>
          <p className="pt-2 font-semibold uppercase">{SIGNATARIO_OFICIO}</p>
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
