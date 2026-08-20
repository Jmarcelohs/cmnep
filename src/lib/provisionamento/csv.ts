// Mesma convenção das rotas de exportação CSV do resto do sistema (ver
// ex.: src/app/api/pessoas/csv/route.ts) — só que rodando no navegador,
// já que os dados deste módulo nunca chegam ao servidor (ver tipos.ts).
function csvEscape(valor: string): string {
  if (/[",\n]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export function montarCsv(cabecalho: string[], linhas: (string | number)[][]): string {
  const corpo = [cabecalho, ...linhas]
    .map((linha) => linha.map((campo) => csvEscape(String(campo ?? ""))).join(","))
    .join("\r\n");
  return "﻿" + corpo;
}

export function baixarArquivo(nomeArquivo: string, conteudo: string, tipo: string): void {
  const blob = new Blob([conteudo], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
