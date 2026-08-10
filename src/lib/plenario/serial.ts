// Google Sheets representa datas/horas como número serial: dias desde
// 30/12/1899 (parte inteira = dia; parte fracionária = hora do dia). Ler
// esse número direto (valueRenderOption=UNFORMATTED_VALUE) em vez do
// texto formatado evita a ambiguidade de dd/mm vs mm/dd que a formatação
// regional da planilha poderia introduzir silenciosamente (ex.:
// "03/04/2026" seria 3 de abril ou 4 de março?).
const EPOCH_MS = Date.UTC(1899, 11, 30);
const MS_POR_DIA = 86400000;

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function serialParaData(serial: number): string {
  const dias = Math.floor(serial);
  const data = new Date(EPOCH_MS + dias * MS_POR_DIA);
  return `${data.getUTCFullYear()}-${pad2(data.getUTCMonth() + 1)}-${pad2(data.getUTCDate())}`;
}

export function serialParaHora(serial: number): string {
  const fracaoDoDia = serial - Math.floor(serial);
  const segundosTotais = Math.round(fracaoDoDia * 86400);
  const horas = Math.floor(segundosTotais / 3600);
  const minutos = Math.floor((segundosTotais % 3600) / 60);
  const segundos = segundosTotais % 60;
  return `${pad2(horas)}:${pad2(minutos)}:${pad2(segundos)}`;
}
