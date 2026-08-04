"use client";

import { useDownloadPdf } from "@/lib/pdf/use-download-pdf";

export function DownloadPdfButton({
  url,
  nomeArquivoPadrao,
  label = "Salvar PDF",
  variant = "pill",
}: {
  url: string;
  nomeArquivoPadrao?: string;
  label?: string;
  // "pill": botão isolado (uso solto, fora de menu). "menu": item de
  // largura cheia pra empilhar dentro do MenuAcoes.
  variant?: "pill" | "menu";
}) {
  const { baixarPdf, carregando, erro } = useDownloadPdf(url, nomeArquivoPadrao);

  const classes =
    variant === "menu"
      ? "block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
      : "rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60";

  return (
    <div className={variant === "menu" ? "" : "inline-flex flex-col items-end gap-1"}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          baixarPdf();
        }}
        disabled={carregando}
        className={classes}
      >
        {carregando ? "Gerando…" : label}
      </button>
      {erro && <p className="px-3 text-xs text-red-600">{erro}</p>}
    </div>
  );
}
