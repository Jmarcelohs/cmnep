"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/rich-text-editor";
import { DOCUMENTOS_PROCESSO } from "@/lib/licitacoes/tipos";
import type { DocumentoProcesso, TipoDocumentoLicitacao } from "@/lib/licitacoes/tipos";
import {
  gerarDocumentoCapa,
  gerarDocumentoCertidaoValor,
  gerarDocumentoDfd,
  gerarDocumentoEtp,
  gerarDocumentoSolicitacaoAbertura,
  gerarDocumentoSolicitacaoCompra,
  gerarDocumentoTr,
  salvarDocumento,
} from "../actions";
import { TrFormulario, type CamposTr } from "./tr-formulario";

type ConfigDocumento = {
  gerar: (processoId: string) => Promise<DocumentoProcesso>;
  imprimirHref: (processoId: string) => string;
  titulo: string;
  dica: string;
};

const CONFIG: Partial<Record<TipoDocumentoLicitacao, ConfigDocumento>> = {
  capa: {
    gerar: gerarDocumentoCapa,
    imprimirHref: (id) => `/licitacoes/${id}/imprimir/capa`,
    titulo: "Capa do Processo — parágrafo de abertura",
    dica: "Gerado automaticamente a partir dos dados do processo — ajuste o texto se precisar antes de imprimir. Os dados do quadro (procedimento, objeto, dotação...) vêm sempre direto do processo.",
  },
  dfd: {
    gerar: gerarDocumentoDfd,
    imprimirHref: (id) => `/licitacoes/${id}/imprimir/dfd`,
    titulo: "DFD — Documento de Formalização da Demanda",
    dica: "Tipificação, tipo de material e prioridade já vêm marcados com o valor mais comum — mude o X de lugar na tabela se este processo for diferente. Revise a justificativa da contratação (seção 2) e o prazo estimado de entrega (seção 4) antes de imprimir.",
  },
  etp: {
    gerar: gerarDocumentoEtp,
    imprimirHref: (id) => `/licitacoes/${id}/imprimir/etp`,
    titulo: "ETP — Estudo Técnico Preliminar",
    dica: "As seções narrativas (necessidade, levantamento de mercado, solução escolhida, resultados esperados) são só um ponto de partida — reescreva com o que foi de fato pesquisado/decidido neste processo antes de imprimir.",
  },
  tr: {
    gerar: gerarDocumentoTr,
    imprimirHref: (id) => `/licitacoes/${id}/imprimir/tr`,
    titulo: "Termo de Referência",
    dica: "A base jurídica (dispensa por valor, obrigações, sanções...) já vem pronta — revise a seção 2 (Fundamentos), que é só um ponto de partida genérico, antes de imprimir.",
  },
  solicitacao_compra: {
    gerar: gerarDocumentoSolicitacaoCompra,
    imprimirHref: (id) => `/licitacoes/${id}/imprimir/solicitacao-compra`,
    titulo: "Solicitação de Compra — parágrafo do pedido",
    dica: "Gera também o Termo de Referência (se ainda não existir) — o pacote impresso junta Solicitação + Proposta Comercial em branco + TR + Anexo I. Anexo II (fotos/medidas) não é gerado automaticamente ainda.",
  },
  certidao_valor: {
    gerar: gerarDocumentoCertidaoValor,
    imprimirHref: (id) => `/licitacoes/${id}/imprimir/certidao-valor`,
    titulo: "Certidão de Valor",
    dica: "A fundamentação legal (art. 75, §1º da Lei 14.133/2021) já vem pronta pra dispensa — revise se os valores-limite citados ainda são os vigentes (mudam por decreto federal) antes de imprimir.",
  },
  solicitacao_abertura: {
    gerar: gerarDocumentoSolicitacaoAbertura,
    imprimirHref: (id) => `/licitacoes/${id}/imprimir/solicitacao-abertura`,
    titulo: "Solicitação de Abertura de Processo",
    dica: "Assinada pelo Agente de Contratação do processo — se ele ainda não foi definido, edite o processo antes de imprimir.",
  },
};

export function ProcessoDetalhe({
  processoId,
  documentos: documentosIniciais,
  camposTr,
}: {
  processoId: string;
  documentos: DocumentoProcesso[];
  camposTr: CamposTr;
}) {
  const [documentos, setDocumentos] = useState<DocumentoProcesso[]>(documentosIniciais);
  const [editando, setEditando] = useState<TipoDocumentoLicitacao | null>(null);
  const [corpoHtml, setCorpoHtml] = useState("");
  const [valoresTr, setValoresTr] = useState<CamposTr>(camposTr);
  const [carregando, setCarregando] = useState<TipoDocumentoLicitacao | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const porTipo = new Map(documentos.map((d) => [d.tipo, d]));

  async function abrirDocumento(tipo: TipoDocumentoLicitacao) {
    const config = CONFIG[tipo];
    if (!config) return;
    setErro(null);
    setCarregando(tipo);
    try {
      let documento = porTipo.get(tipo);
      if (!documento) {
        documento = await config.gerar(processoId);
        setDocumentos((atual) => [...atual, documento!]);
      }
      setCorpoHtml(documento.corpoHtml);
      setEditando(tipo);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível gerar o documento.");
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
      setDocumentos((atual) => atual.map((d) => (d.tipo === editando ? { ...d, corpoHtml } : d)));
      setEditando(null);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (editando === "tr") {
    return (
      <TrFormulario
        processoId={processoId}
        valoresIniciais={valoresTr}
        imprimirHref={CONFIG.tr!.imprimirHref(processoId)}
        onSalvar={(documento, campos) => {
          setDocumentos((atual) => {
            const semTr = atual.filter((d) => d.tipo !== "tr");
            return [...semTr, documento];
          });
          setValoresTr(campos);
          setEditando(null);
        }}
        onFechar={() => setEditando(null)}
      />
    );
  }

  if (editando && CONFIG[editando]) {
    const config = CONFIG[editando]!;
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-700">{config.titulo}</p>
        <p className="mt-1 text-xs text-slate-500">{config.dica}</p>
        <div className="mt-3">
          <RichTextEditor
            name="corpo_html"
            value={corpoHtml}
            onChange={setCorpoHtml}
            margemEsquerdaMm={20}
            margemDireitaMm={20}
            minHeight="10rem"
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
            href={config.imprimirHref(processoId)}
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
              const config = CONFIG[doc.tipo];
              return (
                <tr key={doc.tipo}>
                  <td className="px-4 py-2 text-slate-900">{doc.label}</td>
                  <td className="px-4 py-2 text-right">
                    {!doc.disponivel && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        Em breve
                      </span>
                    )}
                    {doc.disponivel && config && (
                      <div className="flex justify-end gap-3">
                        {gerado && (
                          <a
                            href={config.imprimirHref(processoId)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-brand-navy hover:underline"
                          >
                            Ver / imprimir
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => abrirDocumento(doc.tipo)}
                          disabled={carregando === doc.tipo}
                          className="text-xs font-medium text-brand-navy hover:underline disabled:opacity-50"
                        >
                          {carregando === doc.tipo ? "Gerando…" : gerado ? "Editar" : "Gerar"}
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
