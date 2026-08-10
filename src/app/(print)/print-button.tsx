"use client";

import { useDownloadPdf } from "@/lib/pdf/use-download-pdf";

export function PrintButton({
  url,
  nomeArquivoPadrao,
  // Botão secundário opcional (ex.: baixar em .docx) — só usado pelas
  // Moções por enquanto; as outras chamadas desse componente continuam
  // com um botão só.
  urlSecundaria,
  nomeArquivoSecundarioPadrao,
  rotuloSecundario = "Baixar arquivo",
}: {
  url: string;
  nomeArquivoPadrao?: string;
  urlSecundaria?: string;
  nomeArquivoSecundarioPadrao?: string;
  rotuloSecundario?: string;
}) {
  const { baixarPdf, carregando, erro } = useDownloadPdf(url, nomeArquivoPadrao);
  const {
    baixarPdf: baixarSecundario,
    carregando: carregandoSecundario,
    erro: erroSecundario,
  } = useDownloadPdf(urlSecundaria ?? "", nomeArquivoSecundarioPadrao);

  return (
    <div className="no-print fixed right-6 top-6 flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={baixarPdf}
        disabled={carregando}
        className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white shadow-lg hover:bg-brand-navy-light disabled:opacity-60"
      >
        {carregando ? "Gerando PDF…" : "Salvar PDF"}
      </button>
      {urlSecundaria && (
        <button
          type="button"
          onClick={baixarSecundario}
          disabled={carregandoSecundario}
          className="rounded-md border border-brand-navy bg-white px-4 py-2 text-sm font-medium text-brand-navy shadow-lg hover:bg-slate-50 disabled:opacity-60"
        >
          {carregandoSecundario ? "Gerando…" : rotuloSecundario}
        </button>
      )}
      {erro && (
        <p className="max-w-xs rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 shadow">
          {erro}
        </p>
      )}
      {erroSecundario && (
        <p className="max-w-xs rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 shadow">
          {erroSecundario}
        </p>
      )}
    </div>
  );
}
