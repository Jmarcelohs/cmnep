import type { Contrato } from "./tipos";

// Os contratos em si ficam no Supabase (ver actions.ts) — isso aqui é só
// pro backup manual em JSON da aba Parâmetros (exportar uma cópia à
// parte, ou restaurar/migrar contratos de um arquivo).
export function exportarJson(contratos: Contrato[]): string {
  return JSON.stringify(
    { ferramenta: "provisionamento-orcamentario", versao: 1, exportadoEm: new Date().toISOString(), contratos },
    null,
    2,
  );
}

// Aceita tanto o formato exportado por exportarJson (objeto com
// "contratos") quanto um array puro de contratos — mais tolerante pra
// quem editar o JSON na mão.
export function importarJson(texto: string): Contrato[] {
  const dados = JSON.parse(texto);
  const contratos = Array.isArray(dados) ? dados : dados?.contratos;
  if (!Array.isArray(contratos)) {
    throw new Error("Arquivo inválido — não encontrei uma lista de contratos.");
  }
  return contratos;
}
