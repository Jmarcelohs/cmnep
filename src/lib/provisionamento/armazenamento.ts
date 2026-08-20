import type { Contrato } from "./tipos";

// Ver nota em tipos.ts — este módulo guarda tudo no localStorage do
// navegador, não no Supabase.
const CHAVE = "provisionamento-orcamentario:contratos";

export function carregarContratos(): Contrato[] {
  if (typeof window === "undefined") return [];
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return [];
    const dados = JSON.parse(bruto);
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

export function salvarContratos(contratos: Contrato[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CHAVE, JSON.stringify(contratos));
}

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
