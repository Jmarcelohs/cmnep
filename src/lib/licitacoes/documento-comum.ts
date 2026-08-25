import { formatarMoeda } from "@/lib/pdf/formato";
import type { DotacaoOrcamentaria } from "@/lib/suplementacoes/documento";
import type { ItemProcesso } from "./tipos";

// "Oficial Administrativo — Função Efetiva" → "Oficial Administrativo" —
// a parte antes do travessão é o cargo em si; o resto ("Função Efetiva",
// "Estágio"...) é só o vínculo/categoria, que não entra na menção inline
// do corpo do texto (ver capa real usada de referência).
export function cargoResumido(cargo: string): string {
  return cargo.split("—")[0].trim();
}

// Igual a MESA_DIRETORA (src/lib/suplementacoes/documento.ts) — composição
// fixa por biênio, não lida de uma tabela dinâmica, pro documento gerado
// ficar definitivo mesmo se a composição mudar depois. Matrícula vem dos
// documentos reais usados como modelo (TR e DFD, ambos de 08/2026).
export const PRESIDENTE_MATRICULA = "1089";

// "2001" → "2.001" (atividade/projeto, 4 dígitos: 1 + 3).
function formatarProjetoAtividade(codigo: string): string {
  return `${codigo.slice(0, 1)}.${codigo.slice(1)}`;
}

// "339039" → "3.3.90.39" (natureza de despesa: categoria.grupo.modalidade.elemento).
function formatarElementoDespesa(codigo: string): string {
  return `${codigo.slice(0, 1)}.${codigo.slice(1, 2)}.${codigo.slice(2, 4)}.${codigo.slice(4, 6)}`;
}

// "2.001.3.3.90.39.48 – Serviços Gráficos" — projeto/atividade + elemento
// de despesa (formatados a partir da ficha vinculada) + o subelemento
// digitado livremente no processo (ver migration 0051).
export function montarDotacaoCompleta(
  ficha: DotacaoOrcamentaria | null,
  subelemento: string,
): string {
  if (!ficha) return subelemento || "—";
  const base = `${formatarProjetoAtividade(ficha.projeto_atividade_codigo)}.${formatarElementoDespesa(ficha.elemento_codigo)}`;
  return subelemento ? `${base}.${subelemento}` : base;
}

// Tabela "DEMANDA – BEM/SERVIÇO/OBRAS E/OU INSTALAÇÕES" — igual no TR e
// no DFD (mesmo cadastro de itens do processo, ver processos_licitatorios_itens).
export function tabelaItensHtml(itens: ItemProcesso[]): string {
  const linhas = itens
    .map(
      (i) => `<tr>
        <td>${String(i.numeroItem).padStart(3, "0")}</td>
        <td>${i.objeto}</td>
        <td>${i.unidade}</td>
        <td>${i.quantidade}</td>
        <td>${i.valorUnitario != null ? formatarMoeda(i.valorUnitario) : ""}</td>
        <td>${i.valorGlobal != null ? formatarMoeda(i.valorGlobal) : ""}</td>
      </tr>`,
    )
    .join("");

  return `<p><strong>DEMANDA – BEM/SERVIÇO/OBRAS E/OU INSTALAÇÕES</strong></p>
  <table>
    <thead>
      <tr><th>ITEM</th><th>OBJETO</th><th>UNID.</th><th>QUANT.</th><th>V. UNITÁRIO</th><th>V. GLOBAL</th></tr>
    </thead>
    <tbody>${linhas}</tbody>
  </table>`;
}
