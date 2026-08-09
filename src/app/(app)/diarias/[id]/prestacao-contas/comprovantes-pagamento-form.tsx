"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validarArquivos, sanitizarNomeArquivo } from "@/lib/uploads/validacao";

type Comprovante = {
  id: string;
  nome_original: string;
  tipo: string;
  caminho: string;
};

const TIPOS_ACEITOS_LISTA = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const TIPOS_ACEITOS = TIPOS_ACEITOS_LISTA.join(",");
const LIMITE_BYTES = 10 * 1024 * 1024;

export function ComprovantesPagamentoForm({
  pagamentoId,
  comprovantes,
  podeEditar,
}: {
  pagamentoId: string;
  comprovantes: Comprovante[];
  podeEditar: boolean;
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = e.target.files;
    if (!arquivos || arquivos.length === 0) return;

    const erroValidacao = validarArquivos(Array.from(arquivos), {
      limiteBytes: LIMITE_BYTES,
      tiposAceitos: TIPOS_ACEITOS_LISTA,
    });
    if (erroValidacao) {
      setErro(erroValidacao);
      e.target.value = "";
      return;
    }

    setEnviando(true);
    setErro(null);
    const supabase = createClient();

    try {
      for (const arquivo of Array.from(arquivos)) {
        const tipo = arquivo.type === "application/pdf" ? "pdf" : "imagem";
        const caminho = `${pagamentoId}/${crypto.randomUUID()}-${sanitizarNomeArquivo(arquivo.name)}`;

        const { error: erroUpload } = await supabase.storage
          .from("pagamentos-anexos")
          .upload(caminho, arquivo);
        if (erroUpload) throw erroUpload;

        const { error: erroInsert } = await supabase.from("diarias_prestacoes_pagamentos_anexos").insert({
          pagamento_id: pagamentoId,
          caminho,
          nome_original: arquivo.name,
          tipo,
        });
        if (erroInsert) throw erroInsert;
      }

      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar o arquivo.");
    } finally {
      setEnviando(false);
      e.target.value = "";
    }
  }

  async function handleExcluir(comprovante: Comprovante) {
    if (!confirm(`Excluir "${comprovante.nome_original}"? Essa ação não pode ser desfeita.`)) return;

    const supabase = createClient();
    await supabase.storage.from("pagamentos-anexos").remove([comprovante.caminho]);
    await supabase.from("diarias_prestacoes_pagamentos_anexos").delete().eq("id", comprovante.id);
    router.refresh();
  }

  async function handleAbrir(comprovante: Comprovante) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("pagamentos-anexos")
      .createSignedUrl(comprovante.caminho, 300);
    if (error || !data) {
      setErro("Não foi possível abrir o arquivo.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mt-2 rounded-md bg-slate-50 p-2">
      <p className="text-xs font-medium text-slate-500">Comprovante de pagamento</p>
      <ul className="mt-1 space-y-1">
        {comprovantes.map((c) => (
          <li key={c.id} className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => handleAbrir(c)}
              className="text-left text-brand-navy hover:underline"
            >
              {c.nome_original} <span className="text-slate-400">({c.tipo === "pdf" ? "PDF" : "imagem"})</span>
            </button>
            {podeEditar && (
              <button
                type="button"
                onClick={() => handleExcluir(c)}
                className="text-red-600 hover:text-red-800"
              >
                remover
              </button>
            )}
          </li>
        ))}
        {comprovantes.length === 0 && <li className="text-xs text-slate-400">Nenhum comprovante anexado.</li>}
      </ul>

      {podeEditar && (
        <div className="mt-2">
          <input
            type="file"
            accept={TIPOS_ACEITOS}
            multiple
            onChange={handleUpload}
            disabled={enviando}
            className="text-xs text-slate-600"
          />
          {enviando && <p className="mt-1 text-xs text-slate-500">Enviando…</p>}
          {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
        </div>
      )}
    </div>
  );
}
