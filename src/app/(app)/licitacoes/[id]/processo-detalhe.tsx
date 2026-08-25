"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { DOCUMENTOS_PROCESSO } from "@/lib/licitacoes/tipos";
import type { DocumentoProcesso, TipoDocumentoLicitacao } from "@/lib/licitacoes/tipos";
import { gerarDocumentoCapa, salvarDocumento } from "../actions";

export function ProcessoDetalhe({
  processoId,
  documentos: documentosIniciais,
}: {
  processoId: string;
  documentos: DocumentoProcesso[];
}) {
  const [documentos, setDocumentos] = useState<DocumentoProcesso[]>(documentosIniciais);
  const [editando, setEditando] = useState<TipoDocumentoLicitacao | null>(null);
  const [corpoHtml, setCorpoHtml] = useState("");
  const [carregando, setCarregando] = useState<TipoDocumentoLicitacao | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const porTipo = new Map(documentos.map((d) => [d.tipo, d]));

  async function abrirCapa() {
    setErro(null);
    setCarregando("capa");
    try {
      let documento = porTipo.get("capa");
      if (!documento) {
        documento = await gerarDocumentoCapa(processoId);
        setDocumentos((atual) => [...atual, documento!]);
      }
      setCorpoHtml(documento.corpoHtml);
      setEditando("capa");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível gerar a capa.");
    } finally {
      setCarregando(null);
    }
  }

  async function salvarEdicao() {
    if (!editando) return;
    setSalvando(true);
    setErro(null);
    try {
      await salvarDocumento(processoId, editando, corpoHtml);
      setDocumentos((atual) =>
        atual.map((d) => (d.tipo === editando ? { ...d, corpoHtml } : d)),
      );
      setEditando(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (editando === "capa") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-700">Capa do Processo — parágrafo de abertura</p>
        <p className="mt-1 text-xs text-slate-500">
          Gerado automaticamente a partir dos dados do processo — ajuste o texto se precisar antes de
          imprimir. Os dados do quadro (procedimento, objeto, dotação...) vêm sempre direto do processo.
        </p>
        <div className="mt-3">
          <RichTextEditor
            name="corpo_html"
            value={corpoHtml}
            onChange={setCorpoHtml}
            margemEsquerdaMm={20}
            margemDireitaMm={20}
          />
        </div>
        {erro && <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={salvarEdicao}
            disabled={salvando}
            className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light disabled:opacity-50"
          >
            {salvando ? "Salvando…" : "Salvar"}
          </button>
          <a
            href={`/licitacoes/${processoId}/imprimir/capa`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver / imprimir
          </a>
          <button
            type="button"
            onClick={() => setEditando(null)}
            disabled={salvando}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">Documentos do processo</p>
      {erro && <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}
      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <tbody className="divide-y divide-slate-100">
            {DOCUMENTOS_PROCESSO.map((doc) => {
              const gerado = porTipo.get(doc.tipo);
              return (
                <tr key={doc.tipo}>
                  <td className="px-4 py-2 text-slate-900">{doc.label}</td>
                  <td className="px-4 py-2 text-right">
                    {!doc.disponivel && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        Em breve
                      </span>
                    )}
                    {doc.disponivel && doc.tipo === "capa" && (
                      <div className="flex justify-end gap-3">
                        {gerado && (
                          <a
                            href={`/licitacoes/${processoId}/imprimir/capa`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-brand-navy hover:underline"
                          >
                            Ver / imprimir
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={abrirCapa}
                          disabled={carregando === "capa"}
                          className="text-xs font-medium text-brand-navy hover:underline disabled:opacity-50"
                        >
                          {carregando === "capa" ? "Gerando…" : gerado ? "Editar" : "Gerar"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
