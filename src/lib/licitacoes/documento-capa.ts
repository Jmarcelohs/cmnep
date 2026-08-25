import type { DotacaoOrcamentaria } from "@/lib/suplementacoes/documento";
import type { PessoaResumo } from "./tipos";

// "Oficial Administrativo — Função Efetiva" → "Oficial Administrativo" —
// a parte antes do travessão é o cargo em si; o resto ("Função Efetiva",
// "Estágio"...) é só o vínculo/categoria, que não entra na menção inline
// do corpo do texto (ver capa real usada de referência).
export function cargoResumido(cargo: string): string {
  return cargo.split("—")[0].trim();
}

function designadoPorGenero(genero: PessoaResumo["genero"]): string {
  return genero === "F" ? "designada" : "designado";
}

// Parágrafo de abertura da Capa do Processo — gerado a partir do
// processo/organizador/agente, mas guardado como HTML editável
// (corpo_html da tabela processos_licitatorios_documentos) pra permitir
// ajuste fino antes de imprimir, sem eu precisar acertar 100% a redação
// (nomes/cargos incomuns, concordância) na primeira geração.
export function montarParagrafoAberturaCapa({
  organizador,
  agente,
}: {
  organizador: PessoaResumo | null;
  agente: PessoaResumo | null;
}): string {
  const nomeOrganizador = organizador?.nome ?? "[nome de quem organizou o processo]";
  const designacao = designadoPorGenero(organizador?.genero ?? null);
  const nomeAgente = agente?.nome ?? "[nome do agente de contratação]";
  const cargoAgente = agente ? cargoResumido(agente.cargo) : "[cargo]";

  return `<p>na Câmara Municipal de Nepomuceno, Estado de Minas Gerais, eu, ${nomeOrganizador}, ${designacao} pelo agente de contratação ${nomeAgente} (${cargoAgente}) da Câmara Municipal de Nepomuceno, organizei os documentos deste procedimento de contratação que adiante seguem.</p>`;
}

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
