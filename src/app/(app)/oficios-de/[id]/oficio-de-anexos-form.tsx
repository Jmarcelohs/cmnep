"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validarArquivos, sanitizarNomeArquivo } from "@/lib/uploads/validacao";
import type { TipoAnexoOficio } from "@/lib/supabase/database.types";

type Anexo = {
  id: string;
  nome_original: string;
  tipo: TipoAnexoOficio;
  caminho: string;
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

const TIPO_LABEL: Record<TipoAnexoOficio, string> = {
  pdf: "PDF",
  word: "Word",
  imagem: "imagem",
};

function tipoDoArquivo(mime: string): TipoAnexoOficio {
  if (mime === "application/pdf") return "pdf";
  if (
    mime === "application/msword" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "word";
  }
  return "imagem";
}

export function OficioDEAnexosForm({ oficioId, anexos }: { oficioId: string; anexos: Anexo[] }) {
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
        const caminho = `${oficioId}/${crypto.randomUUID()}-${sanitizarNomeArquivo(arquivo.name)}`;

        const { error: erroUpload } = await supabase.storage
          .from("oficios-de-anexos")
          .upload(caminho, arquivo);
        if (erroUpload) throw erroUpload;

        const { error: erroInsert } = await supabase.from("oficios_diretor_executivo_anexos").insert({
          oficio_id: oficioId,
          caminho,
          nome_original: arquivo.name,
          tipo: tipoDoArquivo(arquivo.type),
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

  async function handleExcluir(anexo: Anexo) {
    if (!confirm(`Excluir "${anexo.nome_original}"? Essa ação não pode ser desfeita.`)) return;

    const supabase = createClient();
    await supabase.storage.from("oficios-de-anexos").remove([anexo.caminho]);
    await supabase.from("oficios_diretor_executivo_anexos").delete().eq("id", anexo.id);
    router.refresh();
  }

  async function handleAbrir(anexo: Anexo) {
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("oficios-de-anexos")
      .createSignedUrl(anexo.caminho, 300);
    if (error || !data) {
      setErro("Não foi possível abrir o arquivo.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Documentos anexados</h3>
      <p className="mt-1 text-xs text-slate-500">
        PDF, Word (DOC/DOCX) e imagens (JPG/PNG/WEBP), até 15MB cada. Anexos em PDF são incluídos
        automaticamente ao final do arquivo quando o ofício é gerado.
      </p>

      <ul className="mt-3 space-y-1">
        {anexos.map((a) => (
          <li key={a.id} className="flex items-center justify-between text-sm text-slate-700">
            <button
              type="button"
              onClick={() => handleAbrir(a)}
              className="text-left text-brand-navy hover:underline"
            >
              {a.nome_original} <span className="text-xs text-slate-400">({TIPO_LABEL[a.tipo]})</span>
            </button>
            <button
              type="button"
              onClick={() => handleExcluir(a)}
              className="text-xs text-red-600 hover:text-red-800"
            >
              remover
            </button>
          </li>
        ))}
        {anexos.length === 0 && <li className="text-sm text-slate-400">Nenhum arquivo anexado.</li>}
      </ul>

      <div className="mt-3">
        <input
          type="file"
          accept={TIPOS_ACEITOS}
          multiple
          onChange={handleUpload}
          disabled={enviando}
          className="text-sm text-slate-600"
        />
        {enviando && <p className="mt-1 text-xs text-slate-500">Enviando…</p>}
        {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
      </div>
    </div>
  );
}
