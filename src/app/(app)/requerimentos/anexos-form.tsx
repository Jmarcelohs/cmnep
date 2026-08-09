"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validarArquivos, sanitizarNomeArquivo } from "@/lib/uploads/validacao";

type Anexo = {
  id: string;
  nome_original: string;
  tipo: string;
  caminho: string;
};

const TIPOS_ACEITOS_LISTA = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const TIPOS_ACEITOS = TIPOS_ACEITOS_LISTA.join(",");
const LIMITE_BYTES = 10 * 1024 * 1024;
const BUCKET = "reembolso-anexos";

export function AnexosForm({
  requerimentoId,
  anexos,
  podeEditar,
}: {
  requerimentoId: string;
  anexos: Anexo[];
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
        const caminho = `${requerimentoId}/${crypto.randomUUID()}-${sanitizarNomeArquivo(arquivo.name)}`;

        const { error: erroUpload } = await supabase.storage.from(BUCKET).upload(caminho, arquivo);
        if (erroUpload) throw erroUpload;

        const { error: erroInsert } = await supabase.from("requerimentos_reembolso_anexos").insert({
          requerimento_id: requerimentoId,
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

  async function handleVer(anexo: Anexo) {
    const supabase = createClient();
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(anexo.caminho, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  async function handleExcluir(anexo: Anexo) {
    if (!confirm(`Excluir "${anexo.nome_original}"? Essa ação não pode ser desfeita.`)) return;

    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([anexo.caminho]);
    await supabase.from("requerimentos_reembolso_anexos").delete().eq("id", anexo.id);
    router.refresh();
  }

  return (
    <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-slate-900">Comprovantes anexados</h3>
      <p className="mt-1 text-xs text-slate-500">
        Comprovantes de abastecimento, estacionamento, passagens etc. — imagens (JPG/PNG/WEBP) ou
        PDF, até 10MB cada.
      </p>

      <ul className="mt-3 space-y-1">
        {anexos.map((a) => (
          <li key={a.id} className="flex items-center justify-between text-sm text-slate-700">
            <button
              type="button"
              onClick={() => handleVer(a)}
              className="text-left hover:underline"
            >
              {a.nome_original}{" "}
              <span className="text-xs text-slate-400">({a.tipo === "pdf" ? "PDF" : "imagem"})</span>
            </button>
            {podeEditar && (
              <button
                type="button"
                onClick={() => handleExcluir(a)}
                className="text-xs text-red-600 hover:text-red-800"
              >
                remover
              </button>
            )}
          </li>
        ))}
        {anexos.length === 0 && (
          <li className="text-sm text-slate-400">Nenhum comprovante anexado.</li>
        )}
      </ul>

      {podeEditar && (
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
      )}
    </div>
  );
}
