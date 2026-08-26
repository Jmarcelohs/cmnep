import { dataPorExtenso } from "@/lib/pdf/formato";
import { primeiraLetraMinuscula, semPontoFinal } from "./documento-comum";
import type { PessoaResumo, Processo } from "./tipos";

// Corpo completo da Solicitação de Abertura de Processo — memorando do
// Setor de Contratações Públicas à Presidência, pedindo autorização pra
// abrir o procedimento e a designação de gestor/fiscal do contrato.
// Assinada pelo Agente de Contratação do processo (agente_contratacao_
// pessoa_id) — a assinatura mostra o CARGO FUNCIONAL "Agente de
// Contratação" (igual o modelo real), não o cargo pessoal dele na tabela
// pessoas (que pode ser qualquer coisa, ex.: "Oficial Administrativo") —
// diferente da Capa, que mostra o cargo pessoal de quem organizou (ver
// capa-conteudo.tsx).
export function montarCorpoSolicitacaoAbertura({
  processo,
  agente,
}: {
  processo: Processo;
  agente: PessoaResumo | null;
}): string {
  const objetoMinusculo = primeiraLetraMinuscula(processo.objeto);
  const nomeAgente = agente?.nome ?? "[nome do agente de contratação]";

  return `<p style="text-align:center;font-size:18pt"><strong>SOLICITAÇÃO</strong></p>

<p>Nepomuceno, ${dataPorExtenso(processo.dataAbertura)}<br />
DE: Setor de Contratações Públicas<br />
PARA: Presidência da Câmara Municipal de Nepomuceno</p>

<p style="text-indent:1.25cm">Com meus cordiais cumprimentos, venho à presença de Vossa Senhoria solicitar autorização de Vossa Senhoria para abertura de procedimento administrativo referente à ${semPontoFinal(objetoMinusculo)}; e que aponte o gestor e o fiscal de contrato do respectivo procedimento.</p>

<p style="text-indent:1.25cm">Atenciosamente,</p>

<p style="text-align:center">${nomeAgente.toUpperCase()}<br />Agente de Contratação</p>`;
}
