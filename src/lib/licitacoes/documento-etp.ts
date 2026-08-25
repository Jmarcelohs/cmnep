import { dataPorExtenso } from "@/lib/pdf/formato";
import { MESA_DIRETORA } from "@/lib/suplementacoes/documento";
import { cargoResumido, PRESIDENTE_MATRICULA, tabelaItensHtml } from "./documento-comum";
import type { ItemProcesso, PessoaResumo, Processo } from "./tipos";

function primeiraLetraMinuscula(texto: string): string {
  return texto ? texto.charAt(0).toLowerCase() + texto.slice(1) : texto;
}

// Remove o ponto final do objeto quando ele entra no meio de uma frase
// maior (ex.: "A {objeto} foi prevista no PCA...") — sem isso, como o
// objeto já termina com ".", sobra um ". foi prevista" (ponto seguido de
// minúscula, no meio da frase).
function semPontoFinal(texto: string): string {
  return texto.replace(/\.\s*$/, "");
}

// Corpo completo do Estudo Técnico Preliminar — igual à Capa/TR/DFD,
// guardado como HTML editável. Diferente do TR (predominantemente base
// jurídica fixa), o ETP é sobretudo narrativa específica do objeto
// (necessidade, alternativas de mercado consideradas, solução escolhida) —
// por isso a maior parte das seções aqui é só um ponto de partida editável,
// não texto jurídico reutilizável. Só as seções realmente procedimentais
// (requisitos da contratação, providências prévias, condições de
// pagamento, conclusão) vêm com texto fixo.
export function montarCorpoETP({
  processo,
  itens,
  pesquisaPrecos,
}: {
  processo: Processo;
  itens: ItemProcesso[];
  pesquisaPrecos: PessoaResumo | null;
}): string {
  const objetoMinusculo = primeiraLetraMinuscula(processo.objeto);
  const nomePesquisaPrecos = pesquisaPrecos?.nome ?? "[nome de quem fez a pesquisa de mercado]";
  const cargoPesquisaPrecos = pesquisaPrecos ? cargoResumido(pesquisaPrecos.cargo) : "[cargo]";

  return `<p><strong>ESTUDO TÉCNICO PRELIMINAR - ETP</strong></p>

<p><strong>INTRODUÇÃO</strong></p>
<p>O presente documento caracteriza a primeira etapa da fase de planejamento e apresenta os devidos estudos para a aquisição de produtos/contratação de serviços que atenderá à necessidade da Câmara Municipal de Nepomuceno em suas necessidades de ordem técnica, administrativa e/ou operacional. O objetivo principal deste documento é estudar detalhadamente a necessidade e identificar no mercado a melhor solução para supri-la, em observância às normas vigentes e aos princípios que regem a Administração Pública. O presente procedimento tem como objetivo a ${objetoMinusculo} O procedimento será regido pelos dispositivos legais previstos na Lei Federal 14.133/21, com destaque especial para o artigo 72 e, sobretudo, para o inciso II do artigo 75. Estas normativas estabelecem as diretrizes e regras aplicáveis aos procedimentos de dispensa de licitação, garantindo a transparência, competitividade e eficiência na escolha da empresa que atenderá às demandas técnicas da Câmara Municipal de Nepomuceno.</p>

<p><strong>DESCRIÇÃO DA NECESSIDADE</strong></p>
<p>[Descreva aqui a necessidade que motiva esta contratação — texto de ponto de partida, ajuste antes de imprimir.]</p>

<p><strong>DESCRIÇÃO DO OBJETO</strong></p>
<p><strong>Objeto Geral:</strong> ${processo.objeto}</p>
${tabelaItensHtml(itens)}

<p><strong>PREVISÃO NO PLANO DE CONTRATAÇÃO ANUAL</strong></p>
<p>A ${semPontoFinal(objetoMinusculo)} foi prevista no Plano Anual de Contratação ${processo.ano} no item: ${processo.vinculoPca || "[vínculo no PCA]"}.</p>

<p><strong>REQUISITOS DA CONTRATAÇÃO</strong></p>
<p>A contratação deverá observar os seguintes requisitos:</p>
<p>a) A execução deverá ser realizada obrigatoriamente por profissionais com experiência comprovada, no prazo de até 10 (dez) dias contados da data de emissão da Ordem de Fornecimento.</p>
<p>b) Os insumos e materiais empregados deverão ser de primeira linha, atendendo aos critérios técnicos de qualidade e durabilidade compatíveis com o uso do prédio público.</p>
<p>c) O objeto será considerado entregue apenas após vistoria que comprove a conformidade com as especificações e a inexistência de vícios ou imperfeições.</p>
<p>d) Em caso de defeitos na execução ou no material, a contratada deverá realizar a substituição/reparo, sem custos adicionais para a Câmara.</p>
<p>e) A contratada é responsável pelo fornecimento e execução nas dependências da Câmara, situada na Praça Padre José, nº 100, Centro, CEP: 37.250-000, Nepomuceno/MG, correndo por sua conta todos os custos de frete, deslocamento e materiais.</p>
<p>f) A interessada deve participar do procedimento de contratação pública via plataforma e/ou e-mail eletrônico, de acordo com o previsto no termo de aviso de contratação publicado no sítio eletrônico oficial da Câmara Municipal de Nepomuceno (www.nepomuceno.mg.leg.br). Os custos relativos ao uso da plataforma de contratação são de única e exclusiva responsabilidade da interessada.</p>
<p>g) A interessada deve atender as características técnicas, de quantitativo e tipo de entrega/serviço, respeitando a especificação técnica e condições de execução previstas no Termo de Referência.</p>
<p>h) A contratação não deve ferir o princípio da sustentabilidade da administração pública, pressupondo a gestão racional dos recursos naturais, bem como a garantia do desenvolvimento econômico, social, cultural e ambiental da sociedade humana.</p>
<p>i) Não é permitida a subcontratação do objeto da contratação.</p>
<p>j) Não serão aceitos a execução dos serviços/entrega dos produtos em desacordo com as condições pactuadas, ficando sob responsabilidade da CONTRATADA o controle sobre a qualidade e a repetição às suas próprias custas para correção de falhas, erros e danos ao erário.</p>
<p>k) Quanto ao critério de julgamento para a contratação será utilizado o <strong>MENOR PREÇO GLOBAL</strong>.</p>
<p>l) Deverá ser comprovado, mediante apresentação de documentação, o atendimento às exigências referentes às habilitações e qualificação mínima conforme previsto no Anexo I do presente Estudo Técnico Preliminar.</p>

<p><strong>ESTIMATIVA DAS QUANTIDADES</strong></p>
<p>[Descreva aqui como o quantitativo estimado foi definido — texto de ponto de partida, ajuste antes de imprimir.]</p>

<p><strong>DO LEVANTAMENTO DE MERCADO</strong></p>
<p>Foram consideradas as seguintes alternativas:</p>
<p>[Descreva aqui as soluções de mercado consideradas e a justificativa da escolhida — texto de ponto de partida, ajuste antes de imprimir.]</p>
<p>Outrossim, para a execução da contratação ora mencionada, também foi realizado pelo(a) servidor(a) ${nomePesquisaPrecos}, ${cargoPesquisaPrecos} da Câmara Municipal de Nepomuceno, o levantamento de potenciais fornecedores para o fornecimento dos bens/produtos com o objetivo de verificar a possibilidade de escolha de propostas mais vantajosas à Administração Pública.</p>

<p><strong>ESTIMATIVA DO PREÇO DA CONTRATAÇÃO</strong></p>
<p>[Informe aqui o valor estimado apurado na pesquisa de preços, com base no art. 23, § 1º da Lei Federal n° 14.133/21 — texto de ponto de partida, ajuste antes de imprimir.]</p>

<p><strong>DESCRIÇÃO DA SOLUÇÃO COMO UM TODO</strong></p>
<p>[Descreva aqui a solução escolhida como um todo — texto de ponto de partida, ajuste antes de imprimir.]</p>

<p><strong>JUSTIFICATIVA PARA O PARCELAMENTO OU NÃO DA CONTRATAÇÃO</strong></p>
<p>A execução do objeto desta contratação não será parcelada, uma vez que os itens, para fins de entrega padronizada, deverão ser fornecidos por um único fornecedor e de uma única vez.</p>

<p><strong>DEMONSTRATIVO DOS RESULTADOS PRETENDIDOS</strong></p>
<p>[Descreva aqui os resultados esperados com a contratação — texto de ponto de partida, ajuste antes de imprimir.]</p>

<p><strong>PROVIDÊNCIAS PRÉVIAS AO CONTRATO</strong></p>
<p>É de responsabilidade da autoridade competente, presidente da Câmara Municipal, designar servidores públicos do quadro de pessoal da Casa Legislativa para exercer a função de Gestor e de Fiscal do Contrato, com o objetivo de acompanhar, gerir e fiscalizar o devido cumprimento dos serviços realizados, com suas respectivas funções estabelecidas pela Lei Federal nº 14.133/21.</p>

<p><strong>CONDIÇÕES DE EXECUÇÃO E PAGAMENTO DO OBJETO</strong></p>
<p>A contratação compreende o atendimento dos requisitos estabelecidos no processo de contratação pública. Ademais, a empresa deve ser responsável pela execução dos serviços e/ou entrega dos produtos conforme previsto no Termo de Referência. A forma de pagamento será feita por meio de transferência bancária ou cheque, após a execução do objeto, apresentação da nota fiscal/recibo de pagamento e relatório de serviço.</p>

<p><strong>REGISTRO DE SOLUÇÕES CONSIDERADAS INVIÁVEIS - ART. 18, § 1º, INC. XIII DA LEI FEDERAL N° 14.133/21</strong></p>
<p>[Descreva aqui as soluções consideradas e descartadas, com a justificativa técnica/econômica de cada uma — texto de ponto de partida, ajuste antes de imprimir.]</p>

<p><strong>CONTRATAÇÕES CORRELATAS</strong></p>
<p>Não se verifica contratações correlatas e/ou interdependentes para a viabilidade e contratação desta demanda.</p>

<p><strong>POSICIONAMENTO CONCLUSIVO</strong></p>
<p>Diante de todo o exposto, conclui-se, primeiramente, pela efetiva necessidade de contratação dos serviços/bens elencados neste Estudo Técnico Preliminar, uma vez necessários para a manutenção das atividades da Câmara Municipal de Nepomuceno/MG. Além disso, por se tratar de contratação necessária ao funcionamento e manutenção das atividades da Câmara Municipal, há de se inferir que a contratação do objeto deste estudo é a solução viável no mercado para o alcance, da melhor forma possível, do interesse público e institucional. Assim sendo, conclui-se pela viabilidade da contratação do objeto deste Estudo Técnico Preliminar.</p>
<p style="text-align:right">Nepomuceno, Minas Gerais, ${dataPorExtenso(processo.dataAbertura)}.</p>
<p style="text-align:center">${MESA_DIRETORA.presidente.nome}<br />${MESA_DIRETORA.presidente.cargo}<br />Matrícula n° ${PRESIDENTE_MATRICULA}</p>`;
}
