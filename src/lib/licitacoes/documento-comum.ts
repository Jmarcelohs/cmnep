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

// Assina a Certidão de Valor (e provavelmente a futura Certidão de
// Orçamento) — mesma convenção de MESA_DIRETORA: fixa, não lida da tabela
// pessoas (mesmo essa pessoa já existindo lá), pra ficar definitivo mesmo
// se quem ocupa o cargo mudar depois. Nome/cargo vêm do modelo real de
// Certidão de Valor (08/2026).
export const DIRETORA_TESOURARIA = {
  nome: "Alexsânia Vitória Martins Alves",
  cargo: "Diretora de Tesouraria e Financeiro",
};

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

// Quadradinho de checkbox solto (sem tabela ao redor) — igual ao modelo
// real do DFD (TIPIFICAÇÃO DO OBJETO / TIPO DE MATERIAL), onde cada opção
// é só um quadrado com "X" seguido do rótulo, sem grade de tabela.
// Depende do <span style="..."> liberado em sanitizar-html.ts — nunca usar
// um glifo Unicode ☐/☒ aqui (some no Adobe Acrobat, ver
// [[camara-nepomuceno-pdf-border-rendering]]).
export function checkboxHtml(marcado: boolean, rotulo: string): string {
  const cor = marcado ? "black" : "white";
  return `<p><span style="display:inline-block;width:4mm;height:4mm;border:2px solid black;background-color:${cor};"></span> ${rotulo}</p>`;
}

// Uma "caixa" de seção — replica o padrão real do DFD, onde cada seção
// numerada (cabeçalho + conteúdo, inclusive uma tabela de itens ou uma
// lista de opções) é um único retângulo contínuo com borda. Cada item do
// array vira uma linha da MESMA tabela — como todo <td> deste módulo já
// tem borda (ver documento-paginado-conteudo.tsx), o resultado visual é
// um quadro só, com divisórias finas entre as linhas internas.
export function caixaHtml(linhasHtml: string[]): string {
  const linhas = linhasHtml.map((html) => `<tr><td>${html}</td></tr>`).join("");
  return `<table><tbody>${linhas}</tbody></table>`;
}
