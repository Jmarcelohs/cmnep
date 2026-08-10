"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validarArquivos, sanitizarNomeArquivo } from "@/lib/uploads/validacao";
import { formatarData } from "@/lib/pdf/formato";
import { CampoBusca } from "@/components/campo-busca";
import type { TipoAnexoOficio, TipoDocumentoLegislacao } from "@/lib/supabase/database.types";

export type Documento = {
  id: string;
  titulo: string;
  tipo: TipoDocumentoLegislacao;
  numero: string | null;
  ano: number | null;
  descricao: string | null;
  caminho: string;
  nome_original: string;
  criado_em: string;
};

const TIPOS_ACEITOS_LISTA = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const TIPOS_ACEITOS = TIPOS_ACEITOS_LISTA.join(",");
const LIMITE_BYTES = 15 * 1024 * 1024;

const TIPO_LABEL: Record<TipoDocumentoLegislacao, string> = {
  lei: "Lei",
  decreto: "Decreto",
  resolucao: "Resolução",
  portaria: "Portaria",
  ato: "Ato",
  outro: "Outro",
};

function tipoArquivoDoMime(mime: string): TipoAnexoOficio {
  if (mime === "application/pdf") return "pdf";
  if (
    mime === "application/msword" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "word";
  }
  return "imagem";
}

export function DocumentosLegislacao({
  documentos,
  podeGerenciar,
  busca,
}: {
  documentos: Documento[];
  podeGerenciar: boolean;
  busca?: string;
}) {
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<TipoDocumentoLegislacao>("lei");
  const [numero, setNumero] = useState("");
  const [ano, setAno] = useState("");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  function limparFormulario() {
    setTitulo("");
    setTipo("lei");
    setNumero("");
    setAno("");
    setDescricao("");
    setArquivo(null);
  }

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    if (!arquivo) {
      setErro("Escolha um arquivo.");
      return;
    }
    if (!titulo.trim()) {
      setErro("Informe um título pro documento.");
      return;
    }
    const erroValidacao = validarArquivos([arquivo], {
      limiteBytes: LIMITE_BYTES,
      tiposAceitos: TIPOS_ACEITOS_LISTA,
    });
    if (erroValidacao) {
      setErro(erroValidacao);
      return;
    }

    setEnviando(true);
    setErro(null);
    const supabase = createClient();

    try {
      const documentoId = crypto.randomUUID();
      const caminho = `${documentoId}/${sanitizarNomeArquivo(arquivo.name)}`;

      const { error: erroUpload } = await supabase.storage
        .from("legislacao-documentos")
        .upload(caminho, arquivo);
      if (erroUpload) throw erroUpload;

      const tipoArquivo = tipoArquivoDoMime(arquivo.type);
      const { error: erroInsert } = await supabase.from("legislacao_documentos").insert({
        id: documentoId,
        titulo: titulo.trim(),
        tipo,
        numero: numero.trim() || null,
        ano: ano ? Number(ano) : null,
        descricao: descricao.trim() || null,
        caminho,
        nome_original: arquivo.name,
        tipo_arquivo: tipoArquivo,
      });
      if (erroInsert) throw erroInsert;

      if (tipoArquivo === "pdf") {
        try {
          await fetch(`/api/legislacao/${documentoId}/extrair-texto`, { method: "POST" });
        } catch {
          // Upload já concluído — se a extração falhar, o documento só
          // fica sem busca por conteúdo (ainda buscável por título/
          // descrição/número).
        }
      }

      limparFormulario();
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar o documento.");
    } finally {
      setEnviando(false);
    }
  }

  async function handleExcluir(doc: Documento) {
    if (!confirm(`Excluir "${doc.titulo}"? Essa ação não pode ser desfeita.`)) return;
    const supabase = createClient();
    await supabase.storage.from("legislacao-documentos").remove([doc.caminho]);
    await supabase.from("legislacao_documentos").delete().eq("id", doc.id);
    router.refresh();
  }

  async function handleAbrir(doc: Documento) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("legislacao-documentos")
      .createSignedUrl(doc.caminho, 300);
    if (error || !data) {
      setErro("Não foi possível abrir o arquivo.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function handleBaixar(doc: Documento) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("legislacao-documentos")
      .createSignedUrl(doc.caminho, 300, { download: doc.nome_original });
    if (error || !data) {
      setErro("Não foi possível baixar o arquivo.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-white p-6">
      <h2 className="text-sm font-semibold text-slate-900">
        Documentos cadastrados manualmente
      </h2>
      <p className="mt-1 text-xs text-slate-500">
        Leis, decretos, resoluções ou outros documentos que ainda não estão no acervo do leis.org.
      </p>

      <form action="/legislacao" className="mt-3 flex flex-wrap items-end gap-2">
        <CampoBusca
          id="busca-legislacao"
          defaultValue={busca}
          label="Buscar nos documentos cadastrados"
          placeholder="Palavra no título, número ou dentro do PDF..."
        />
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Buscar
        </button>
        {busca && (
          <a href="/legislacao" className="text-xs text-slate-500 hover:underline">
            limpar busca
          </a>
        )}
      </form>
      {busca && (
        <p className="mt-2 text-xs text-slate-500">
          {documentos.length} resultado(s) para &quot;{busca}&quot; — busca inclui o texto dentro
          dos PDFs cadastrados.
        </p>
      )}

      <ul className="mt-3 divide-y divide-slate-100">
        {documentos.map((doc) => (
          <li key={doc.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => handleAbrir(doc)}
                className="text-left font-medium text-brand-navy hover:underline"
              >
                {doc.titulo}
              </button>
              <p className="mt-0.5 text-xs text-slate-500">
                {TIPO_LABEL[doc.tipo]}
                {doc.numero && ` nº ${doc.numero}`}
                {doc.ano && `/${doc.ano}`} · enviado em {formatarData(doc.criado_em.slice(0, 10))}
                {doc.descricao && ` — ${doc.descricao}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => handleBaixar(doc)}
                className="text-xs text-brand-navy hover:underline"
              >
                baixar
              </button>
              {podeGerenciar && (
                <button
                  type="button"
                  onClick={() => handleExcluir(doc)}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  excluir
                </button>
              )}
            </div>
          </li>
        ))}
        {documentos.length === 0 && (
          <li className="py-2 text-sm text-slate-400">Nenhum documento cadastrado ainda.</li>
        )}
      </ul>

      {podeGerenciar && (
        <form onSubmit={handleEnviar} className="mt-4 space-y-3 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="titulo" className="block text-xs font-medium text-slate-500">Título</label>
              <input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex.: Lei que institui o Plano Diretor"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="tipo" className="block text-xs font-medium text-slate-500">Tipo</label>
              <select
                id="tipo"
                value={tipo}
                onChange={(e) => setTipo(e.target.value as TipoDocumentoLegislacao)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              >
                {(Object.keys(TIPO_LABEL) as TipoDocumentoLegislacao[]).map((t) => (
                  <option key={t} value={t}>
                    {TIPO_LABEL[t]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="numero" className="block text-xs font-medium text-slate-500">
                Número (opcional)
              </label>
              <input
                id="numero"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ano" className="block text-xs font-medium text-slate-500">
                Ano (opcional)
              </label>
              <input
                id="ano"
                type="number"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="descricao" className="block text-xs font-medium text-slate-500">
              Descrição (opcional)
            </label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="arquivo" className="block text-xs font-medium text-slate-500">
              Arquivo (PDF, Word ou imagem, até 15MB)
            </label>
            <input
              id="arquivo"
              type="file"
              accept={TIPOS_ACEITOS}
              onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
              className="mt-1 text-sm text-slate-600"
            />
          </div>
          <button
            type="submit"
            disabled={enviando}
            className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light disabled:opacity-60"
          >
            {enviando ? "Enviando…" : "Cadastrar documento"}
          </button>
          {erro && <p className="text-xs text-red-600">{erro}</p>}
        </form>
      )}
    </div>
  );
}
