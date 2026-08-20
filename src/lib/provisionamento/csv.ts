// Mesma convenção das rotas de exportação CSV do resto do sistema (ver
// ex.: src/app/api/pessoas/csv/route.ts) — só que montada e baixada direto
// no navegador (os dados já chegaram nele via os Server Actions de
// actions.ts, não precisa de uma rota /api à parte só pra isso).
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
