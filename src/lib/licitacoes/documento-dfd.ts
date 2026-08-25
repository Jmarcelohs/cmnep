import { dataPorExtenso } from "@/lib/pdf/formato";
import { MESA_DIRETORA } from "@/lib/suplementacoes/documento";
import { PRESIDENTE_MATRICULA, tabelaItensHtml } from "./documento-comum";
import type { ItemProcesso, Processo } from "./tipos";

// Checkbox de uma coluna só (label + "X" na linha marcada) — mesma
// convenção já usada no TR (tipo de julgamento, natureza da execução).
function tabelaChecagemHtml(opcoes: { rotulo: string; marcado: boolean }[]): string {
  const linhas = opcoes
    .map((o) => `<tr><td>${o.rotulo}</td><td>${o.marcado ? "X" : ""}</td></tr>`)
    .join("");
  return `<table><tbody>${linhas}</tbody></table>`;
}

// Corpo completo do DFD (Documento de Formalização da Demanda) — igual à
// Capa e ao TR, guardado como HTML editável (mesmo padrão): os campos que
// são sempre praticamente os mesmos nesta Câmara (tipificação "Contratação
// de Serviços", tipo de material "Não se aplica", prioridade "Baixa" com a
// justificativa padrão) já vêm marcados/preenchidos, mas o usuário pode
// mudar o "X" de lugar ou reescrever o texto antes de imprimir — não é
// modelado como campo estruturado no processo porque varia pouco na
// prática e a tabela já é livremente editável no editor de texto rico.
export function montarCorpoDFD({
  processo,
  itens,
}: {
  processo: Processo;
  itens: ItemProcesso[];
}): string {
  return `<p><strong>DOCUMENTO DE FORMALIZAÇÃO DA DEMANDA – DFD</strong></p>

<table>
  <tbody>
    <tr><td>Órgão: CÂMARA MUNICIPAL DE NEPOMUCENO</td></tr>
    <tr><td>Setor Requisitante: Gabinete da Presidência</td></tr>
    <tr><td>Responsável pela Demanda: ${MESA_DIRETORA.presidente.nome}</td></tr>
    <tr><td>Matrícula do Requisitante: ${PRESIDENTE_MATRICULA}</td></tr>
    <tr><td>E-mail: camaranepomuceno@hotmail.com — Telefone: (35) 3668-0251</td></tr>
  </tbody>
</table>

<p><strong>TIPIFICAÇÃO DO OBJETO:</strong></p>
${tabelaChecagemHtml([
  { rotulo: "AQUISIÇÃO DE BENS, MATERIAIS OU PRODUTOS", marcado: false },
  { rotulo: "CONTRATAÇÃO DE SERVIÇOS", marcado: true },
  { rotulo: "OBRAS E INSTALAÇÕES", marcado: false },
])}

<p><strong>TIPO DE MATERIAL:</strong></p>
${tabelaChecagemHtml([
  { rotulo: "MATERIAL PERMANENTE", marcado: false },
  { rotulo: "MATERIAL DE CONSUMO", marcado: false },
  { rotulo: "NÃO SE APLICA", marcado: true },
])}

<p><strong>1. DO OBJETO:</strong> ${processo.objeto}</p>
${tabelaItensHtml(itens)}

<p><strong>2. DA JUSTIFICATIVA DA CONTRATAÇÃO DOS SERVIÇOS E/OU AQUISIÇÃO DOS BENS</strong></p>
<p>[Descreva aqui a justificativa da contratação — texto de ponto de partida, ajuste antes de imprimir.]</p>

<p><strong>3. PRIORIDADE DA CONTRATAÇÃO</strong></p>
${tabelaChecagemHtml([
  { rotulo: "BAIXA", marcado: true },
  { rotulo: "MÉDIA", marcado: false },
  { rotulo: "ALTA", marcado: false },
])}
<p><strong>JUSTIFICATIVA:</strong> O grau de prioridade desta contratação é classificado como baixo, uma vez que sua execução não compromete o funcionamento das atividades essenciais da unidade. A ausência ou o atraso na formalização do contrato não acarreta prejuízos imediatos às operações institucionais, tampouco impacta prazos críticos ou obrigações legais inadiáveis. Trata-se, portanto, de demanda de caráter acessório, cuja contratação pode ser realizada de forma planejada, sem urgência ou necessidade de tramitação prioritária.</p>

<p><strong>4. DATA ESTIMATIVA PARA ENTREGA DO BEM OU DO SERVIÇO</strong></p>
<p>[Descreva aqui o prazo estimado de entrega/execução — texto de ponto de partida, ajuste antes de imprimir.]</p>

<p><strong>5. Previsão no PCA</strong></p>
<p>Sim. Foi previsto no Plano Anual de Contratação ${processo.ano} no item: ${processo.vinculoPca || "[vínculo no PCA]"}, conforme publicado no sítio eletrônico oficial da Câmara Municipal de Nepomuceno (www.nepomuceno.mg.leg.br) e no Portal Nacional de Contratações Públicas – PNCP (https://www.gov.br/pncp/pt-br).</p>

<p><strong>6. Responsável pela Demanda</strong></p>
<p style="text-align:center">${MESA_DIRETORA.presidente.nome}<br />${MESA_DIRETORA.presidente.cargo}<br />Matrícula n° ${PRESIDENTE_MATRICULA}</p>
<p style="text-align:right">Nepomuceno, Minas Gerais, ${dataPorExtenso(processo.dataAbertura)}.</p>

<p><strong>7. Aprovação do Ordenador de Despesas</strong></p>
<p style="text-align:center">${MESA_DIRETORA.presidente.nome}<br />${MESA_DIRETORA.presidente.cargo}<br />${MESA_DIRETORA.bienio}</p>
<p style="text-align:right">Nepomuceno, Minas Gerais, ${dataPorExtenso(processo.dataAbertura)}.</p>`;
}
