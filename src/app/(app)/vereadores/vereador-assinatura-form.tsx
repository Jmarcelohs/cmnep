"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { validarArquivos } from "@/lib/uploads/validacao";

const BUCKET = "vereadores-assinaturas";
const TIPOS_ACEITOS_LISTA = ["image/jpeg", "image/png", "image/webp"];
const LIMITE_BYTES = 2 * 1024 * 1024;

export function VereadorAssinaturaForm({
  vereadorId,
  assinaturaUrlAtual,
}: {
  vereadorId: string;
  assinaturaUrlAtual: string | null;
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [preview, setPreview] = useState(assinaturaUrlAtual);
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    const erroValidacao = validarArquivos([arquivo], {
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
      // Caminho fixo (sem extensão) — cada novo upload sobrescreve o
      // anterior, já que só existe uma assinatura por vereador.
      const caminho = `${vereadorId}/assinatura`;

      const { error: erroUpload } = await supabase.storage
        .from(BUCKET)
        .upload(caminho, arquivo, { upsert: true });
      if (erroUpload) throw erroUpload;

      const { error: erroUpdate } = await supabase
        .from("vereadores")
        .update({ assinatura_caminho: caminho })
        .eq("id", vereadorId);
      if (erroUpdate) throw erroUpdate;

      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, 300);
      setPreview(data?.signedUrl ?? null);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar a assinatura.");
    } finally {
      setEnviando(false);
      e.target.value = "";
    }
  }

  async function handleRemover() {
    if (!confirm("Remover a imagem de assinatura?")) return;

    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([`${vereadorId}/assinatura`]);
    await supabase.from("vereadores").update({ assinatura_caminho: null }).eq("id", vereadorId);

    setPreview(null);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <label htmlFor="vereador-assinatura" className="block text-sm font-medium text-slate-700">
        Imagem da assinatura
      </label>
      <p className="mt-1 text-xs text-slate-500">
        Colada automaticamente sob o nome deste vereador em toda moção que ele assinar. Prefira PNG
        com fundo transparente ou branco. JPG, PNG ou WEBP, até 2MB.
      </p>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- prévia de URL assinada dinâmica, sem domínio fixo pra configurar no next/image
        <img
          src={preview}
          alt="Assinatura"
          className="mt-3 h-20 w-48 rounded border border-slate-300 bg-white object-contain"
        />
      )}

      <div className="mt-3 flex items-center gap-3">
        <input
          id="vereador-assinatura"
          type="file"
          accept={TIPOS_ACEITOS_LISTA.join(",")}
          onChange={handleUpload}
          disabled={enviando}
          className="text-sm text-slate-600"
        />
        {preview && (
          <button
            type="button"
            onClick={handleRemover}
            className="text-xs font-medium text-red-600 hover:text-red-800"
          >
            Remover assinatura
          </button>
        )}
      </div>
      {enviando && <p className="mt-1 text-xs text-slate-500">Enviando…</p>}
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  );
}
