"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "decretos-fotos";

export function DecretoFotoForm({
  decretoId,
  fotoUrlAtual,
}: {
  decretoId: string;
  fotoUrlAtual: string | null;
}) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [preview, setPreview] = useState(fotoUrlAtual);
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    if (!arquivo) return;

    setEnviando(true);
    setErro(null);
    const supabase = createClient();

    try {
      // Caminho fixo (sem extensão) — cada novo upload sobrescreve o
      // anterior, já que só existe uma foto por decreto.
      const caminho = `${decretoId}/foto`;

      const { error: erroUpload } = await supabase.storage
        .from(BUCKET)
        .upload(caminho, arquivo, { upsert: true });
      if (erroUpload) throw erroUpload;

      const { error: erroUpdate } = await supabase
        .from("decretos_titulo_honorario")
        .update({ foto_caminho: caminho })
        .eq("id", decretoId);
      if (erroUpdate) throw erroUpdate;

      const { data } = await supabase.storage.from(BUCKET).createSignedUrl(caminho, 300);
      setPreview(data?.signedUrl ?? null);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar a foto.");
    } finally {
      setEnviando(false);
      e.target.value = "";
    }
  }

  async function handleRemover() {
    if (!confirm("Remover a foto do homenageado?")) return;

    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([`${decretoId}/foto`]);
    await supabase
      .from("decretos_titulo_honorario")
      .update({ foto_caminho: null })
      .eq("id", decretoId);

    setPreview(null);
    router.refresh();
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <label htmlFor="decreto-foto" className="block text-sm font-medium text-slate-700">Foto do homenageado (opcional)</label>
      <p className="mt-1 text-xs text-slate-500">
        Aparece na página da justificativa do PDF. JPG, PNG ou WEBP, até 5MB.
      </p>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- prévia de URL assinada dinâmica, sem domínio fixo pra configurar no next/image
        <img
          src={preview}
          alt="Foto do homenageado"
          className="mt-3 h-32 w-24 rounded border border-slate-300 object-cover"
        />
      )}

      <div className="mt-3 flex items-center gap-3">
        <input
          id="decreto-foto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
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
            Remover foto
          </button>
        )}
      </div>
      {enviando && <p className="mt-1 text-xs text-slate-500">Enviando…</p>}
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  );
}
