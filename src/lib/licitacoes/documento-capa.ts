import { cargoResumido } from "./documento-comum";
import type { PessoaResumo } from "./tipos";

export { cargoResumido, montarDotacaoCompleta } from "./documento-comum";

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
