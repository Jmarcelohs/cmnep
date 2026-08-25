import { formatarMoeda } from "@/lib/pdf/formato";
import { MESA_DIRETORA } from "@/lib/suplementacoes/documento";
import { cargoResumido, montarDotacaoCompleta } from "./documento-capa";
import type { DotacaoOrcamentaria } from "@/lib/suplementacoes/documento";
import type { ItemProcesso, PessoaResumo, Processo } from "./tipos";

// Igual a MESA_DIRETORA (src/lib/suplementacoes/documento.ts) — composição
// fixa por biênio, não lida de uma tabela dinâmica, pro documento gerado
// ficar definitivo mesmo se a composição mudar depois. Matrícula vem do
// Termo de Referência real usado como modelo (04/08/2026).
const PRESIDENTE_MATRICULA = "1089";

function tabelaItensHtml(itens: ItemProcesso[]): string {
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

// Só a fundamentação de dispensa por valor (inciso II, art. 75) — as
// demais modalidades ainda não têm o texto legal correspondente montado;
// fica um espaço reservado editável até eu montar o modelo delas.
function fundamentacaoModalidadeHtml(processo: Processo): string {
  if (processo.modalidade !== "dispensa") {
    return `<p>[Fundamentação legal específica desta modalidade — ajuste este parágrafo conforme o processo.]</p>`;
  }
  return `<p>3.1. A presente contratação será feita por meio de dispensa de licitação, com base no inciso II, artigo 75 da Lei Federal n.º 14.133/2021.</p>
    <p>3.2 Em razão do valor da contratação, isto, porque, como previsto por meio de pesquisa de preço amparada no art. 23 da Lei Federal n° 14.133/23, o valor global do respectivo serviço a ser contratado é inferior ao valor previsto no inciso II, do artigo 75 da Lei Federal n° 14.133/2021.</p>
    <p>3.3 Em razão da viabilidade de competição, ainda que em um procedimento de dispensa de licitação, dado que, mesmo que seja o presente objeto relacionado a uma compra/contratação de um produto/serviço realizado por meio de um procedimento que dispensa a licitação, a competição ainda se faz necessária e possível nos moldes da Lei para apurar a proposta mais vantajosa - em atenção aos princípios da administração pública e aos princípios previstos na Lei Federal n° 14.133/21 – para a Câmara Municipal de Nepomuceno.</p>
    <p>3.4 Em razão da questão dos custos e benefícios oriundos da dispensa de licitação que são: a razoabilidade na gestão econômica dos custos propriamente ditos, derivados dos atos materiais da licitação, tais como: a publicação em diários e imprensas oficiais, bem como, em relação a custos como no caso de tempo, uma vez que, há um prazo maior (considerando o número de atos envolvidos) para o desenvolvimento de um processo licitatório.</p>
    <p>3.5 Em razão da possibilidade de se fazer um procedimento de contratação direta por meio digital no valor teto previsto na Lei, devidamente atualizado monetariamente.</p>
    <p>3.6 Atender a toda documentação exigida nos termos do Anexo I do presente Termo de Referência.</p>`;
}

// Corpo completo do Termo de Referência — base jurídica fixa (confirmado
// com o usuário: as seções que citam a Lei 14.133/2021 são iguais em toda
// dispensa por valor), com objeto/itens/dotação/gestor/fiscal
// interpolados. Guardado como HTML editável (mesmo padrão da Capa) — ajuste
// livre antes de imprimir, já que a seção 2 (Fundamentos) é só um ponto de
// partida genérico, não a justificativa técnica específica do processo.
export function montarCorpoTR({
  processo,
  itens,
  ficha,
  gestor,
  fiscal,
}: {
  processo: Processo;
  itens: ItemProcesso[];
  ficha: DotacaoOrcamentaria | null;
  gestor: PessoaResumo | null;
  fiscal: PessoaResumo | null;
}): string {
  const dotacaoCompleta = montarDotacaoCompleta(ficha, processo.dotacaoSubelemento);
  const nomeGestor = gestor?.nome ?? "[nome do gestor do contrato]";
  const cargoGestor = gestor ? cargoResumido(gestor.cargo) : "[cargo]";
  const nomeFiscal = fiscal?.nome ?? "[nome do fiscal do contrato]";
  const cargoFiscal = fiscal ? cargoResumido(fiscal.cargo) : "[cargo]";

  return `<p><strong>TERMO DE REFERÊNCIA</strong></p>
<p><strong>1. OBJETO</strong></p>
<p>${processo.objeto}</p>
${tabelaItensHtml(itens)}

<p><strong>2. FUNDAMENTOS DA CONTRATAÇÃO</strong></p>
<p>2.1. A contratação se baseia no Estudo Técnico Preliminar (ETP) realizado para a análise da viabilidade da contratação.</p>
<p>2.2. No ETP, com base nos requisitos para a contratação, foi realizado levantamento de mercado, que concluiu pela real necessidade da presente contratação. A conclusão pela necessidade de contratação se justifica pelo fato de que não se vislumbra outra solução viável no mercado senão a contratação do objeto descrito no item 1. Além disso, foi realizado levantamento dos potenciais fornecedores com o objetivo de verificar a possibilidade de escolha de propostas mais vantajosas para a Administração Pública.</p>
<p>[Descreva aqui a solução escolhida e o resultado esperado, com base no ETP deste processo — texto de ponto de partida, ajuste antes de imprimir.]</p>

<p><strong>3. DA JUSTIFICATIVA DA SITUAÇÃO DE DISPENSA DE LICITAÇÃO EM RAZÃO DE VALOR</strong></p>
${fundamentacaoModalidadeHtml(processo)}

<p><strong>4. REQUISITOS DA CONTRATAÇÃO</strong></p>
<p>A contratação deverá observar os seguintes requisitos:</p>
<p>4.1 A execução deverá ocorrer no prazo de até 10 (dez) dias contados da data de emissão da Ordem de Fornecimento, salvo prazo diverso definido neste processo.</p>
<p>4.2 O objeto será considerado entregue apenas após vistoria que comprove a conformidade com as especificações e a inexistência de vícios ou imperfeições.</p>
<p>4.3 Em caso de defeitos na execução ou no material, a contratada deverá realizar a substituição/reparo, sem custos adicionais para a Câmara.</p>
<p>4.4 Local de Entrega e Execução: a contratada é responsável pelo fornecimento e execução nas dependências da Câmara, situada na Praça Padre José, nº 100, Centro, CEP: 37.250-000, Nepomuceno/MG, correndo por sua conta todos os custos de frete, deslocamento e materiais.</p>
<p>4.5 A interessada deve participar do procedimento de contratação pública via plataforma e/ou e-mail eletrônico, de acordo com o previsto no termo de aviso de contratação publicado no sítio eletrônico oficial da Câmara Municipal de Nepomuceno (www.nepomuceno.mg.leg.br). Os custos relativos ao uso da plataforma de contratação são de única e exclusiva responsabilidade da interessada.</p>
<p>4.6 A contratação não deve ferir o princípio da sustentabilidade da administração pública, pressupondo a gestão racional dos recursos naturais, bem como a garantia do desenvolvimento econômico, social, cultural e ambiental da sociedade humana.</p>
<p>4.7 Não é permitida a subcontratação do objeto da contratação.</p>
<p>4.8 Quanto ao critério de julgamento para a contratação será utilizado o <strong>MENOR PREÇO GLOBAL</strong>.</p>
<p>4.9 Deverá ser comprovado, mediante apresentação de documentação, o atendimento às exigências referentes às habilitações e qualificação mínima conforme previsto no Anexo I do presente Termo de Referência.</p>

<p><strong>5. DO PREÇO MÉDIO PARA A EXECUÇÃO DO OBJETO</strong></p>
<p>O preço médio global para a presente contratação, como demonstrado em documento de pesquisa de preço, atende o que está dentro do limite da dispensa de licitação Art. 75, inc. II, e previsto no Plano de Contratações Anual – PCA ${processo.ano}.</p>

<p><strong>6. DO TIPO DE JULGAMENTO</strong></p>
<table>
  <tbody>
    <tr><td>MENOR PREÇO GLOBAL</td><td>X</td></tr>
    <tr><td>MENOR PREÇO POR LOTE</td><td></td></tr>
    <tr><td>MAIOR DESCONTO</td><td></td></tr>
    <tr><td>MELHOR TÉCNICA OU CONTEÚDO ARTÍSTICO</td><td></td></tr>
    <tr><td>MAIOR LANCE</td><td></td></tr>
  </tbody>
</table>
<p>6.1 A contratação será realizada pelo critério de julgamento de menor preço global, por se tratar de objeto com especificações técnicas objetivas e suficientemente detalhadas, que permitem a padronização das condições de execução e a comparação direta entre as propostas apresentadas pelos interessados, em consonância com os princípios da economicidade, da eficiência e do interesse público.</p>

<p><strong>7. DA DOTAÇÃO ORÇAMENTÁRIA</strong></p>
<p>7.1 A despesa decorrente da execução do objeto correrá à conta do orçamento da Câmara Municipal de Nepomuceno na dotação ${dotacaoCompleta}.</p>

<p><strong>8. OBRIGAÇÕES DA CONTRATADA</strong></p>
<p>8.1 Executar o objeto conforme especificações previstas neste Termo de Referência e em sua proposta, com a alocação dos empregados necessários ao perfeito cumprimento das cláusulas contratuais, além de fornecer e utilizar os materiais e equipamentos, ferramentas e utensílios necessários, na qualidade e quantidade mínimas especificadas neste documento e na proposta;</p>
<p>8.2 Reparar, corrigir, remover ou substituir, às suas expensas, no total ou em parte, no prazo fixado pelo fiscal do contrato, os serviços/produtos em que se verificarem vícios, defeitos ou incorreções resultantes da execução ou dos materiais empregados;</p>
<p>8.3 Utilizar empregados habilitados e com conhecimentos básicos do objeto a ser executado, em conformidade com as normas e determinações em vigor;</p>
<p>8.4 Submeter previamente, por escrito, à Contratante, para análise e aprovação, quaisquer mudanças nos métodos executivos que fujam às especificações do objeto;</p>
<p>8.5 Manter durante toda a vigência do contrato, em compatibilidade com as obrigações assumidas, todas as condições de habilitação e qualificação exigidas para a contratação;</p>
<p>8.6 Cumprir com a execução do objeto dentro dos conceitos éticos e morais, obedecendo como regra as disposições previstas neste Termo de Referência.</p>

<p><strong>9. OBRIGAÇÕES DA CONTRATANTE</strong></p>
<p>9.1. Exigir o cumprimento de todas as obrigações assumidas pela Contratada, de acordo com as cláusulas contratuais e os termos de sua proposta;</p>
<p>9.2. Notificar a Contratada por escrito da ocorrência de eventuais imperfeições, falhas ou irregularidades constatadas no curso da execução, fixando prazo para a sua correção, certificando-se que as soluções por ela propostas sejam as mais adequadas;</p>
<p>9.3. Pagar à Contratada o valor resultante da prestação do objeto, no prazo e condições estabelecidas neste Termo de Referência;</p>
<p>9.4 Atender e responder a dúvidas e necessidades apresentadas pela Contratada, dentro das condições legais e de contratação previstas e resolver os casos omissos.</p>

<p><strong>10. DO PAGAMENTO</strong></p>
<p>10.1 O pagamento a favor do contratado será efetuado até o 5° (quinto) dia útil após a execução do objeto, mediante a apresentação da respectiva Nota Fiscal, com as devidas retenções apontadas e, se a empresa é ou não, optante pelo simples nacional, a qual será devidamente atestada pelo setor competente. Para os fins de pagamento ainda será solicitada a apresentação das certidões de habilitação mínima exigida no procedimento administrativo para a comprovação dos requisitos de habilitação.</p>
<p>10.2 Na ocorrência de rejeição da(s) Nota(s) Fiscal(is), motivada por erro ou incorreções, o prazo para pagamento passará a ser contado a partir da data da sua reapresentação.</p>
<p>10.3 Nenhum pagamento será efetuado enquanto pendente de liquidação qualquer obrigação financeira, sem que isso gere direito à alteração de preços ou a compensação financeira.</p>
<p>10.4 O pagamento será feito por meio de ordem bancária em conta a ser indicada pela contratada, cuja ordem bancária dará quitação ao pagamento.</p>
<p>10.5 O CNPJ contido na nota fiscal/fatura emitida pela Contratada deverá ser o mesmo que estiver registrado no contrato celebrado ou instrumento equivalente, independentemente da favorecida ser matriz, filial, sucursal ou agência.</p>

<p><strong>11. DA GESTÃO E FISCALIZAÇÃO DO CONTRATO</strong></p>
<p>11.1. A gestão do contrato caberá ao(à) Sr(a). ${nomeGestor}, ${cargoGestor}, conforme nomeação prevista em ato de autorização do referido processo administrativo, exercendo as atividades inerentes à função, conforme estabelecidos nas normas vigentes e neste termo de referência;</p>
<p>11.2. A fiscalização do contrato caberá ao(à) Sr(a). ${nomeFiscal}, ${cargoFiscal}, conforme nomeação prevista em ato de autorização do referido processo administrativo, exercendo as atividades inerentes à função, conforme estabelecidos nas normas vigentes e neste termo de referência;</p>
<p>11.3. Caberá ao fiscalizador do contrato proceder às anotações das ocorrências relacionadas com a execução do objeto, determinando o que for necessário à regularização das falhas observadas, visando o efetivo cumprimento do objeto contratado;</p>
<p>11.4. A fiscalização exercida não exclui ou reduz a responsabilidade da CONTRATADA por qualquer irregularidade, inclusive perante terceiros e, na sua ocorrência, não implica corresponsabilidade da Câmara Municipal de Nepomuceno ou de seus agentes e prepostos;</p>
<p>11.5. No que couber, aplica-se o disposto no Decreto Federal 11.246/2022, conforme autoriza o art. 187 da Lei 14.133/2021.</p>

<p><strong>12. DAS INFRAÇÕES E SANÇÕES ADMINISTRATIVAS</strong></p>
<p>12.1. O licitante ou o contratado será responsabilizado administrativamente pelas infrações previstas nos arts. 155 e 156 da Lei Federal nº 14.133/2021, entre elas: dar causa à inexecução parcial ou total do contrato; deixar de entregar a documentação exigida para o certame; não manter a proposta, salvo em decorrência de fato superveniente devidamente justificado; não celebrar o contrato ou não entregar a documentação exigida quando convocado dentro do prazo de validade de sua proposta; ensejar o retardamento da execução ou da entrega do objeto sem motivo justificado; apresentar declaração ou documentação falsa; fraudar a licitação ou praticar ato fraudulento na execução do contrato; comportar-se de modo inidôneo ou cometer fraude de qualquer natureza; praticar atos ilícitos com vistas a frustrar os objetivos da licitação; ou praticar ato lesivo previsto no art. 5º da Lei nº 12.846, de 1º de agosto de 2013.</p>
<p>12.2. Serão aplicadas ao responsável pelas infrações administrativas as seguintes sanções, conforme previsto na Lei 14.133/2021: advertência; multa, de no mínimo 0,5% (cinco décimos por cento) e no máximo de 30% (trinta por cento) do valor do objeto licitado ou contratado; impedimento de licitar e contratar, pelo prazo máximo de 3 (três) anos; e declaração de inidoneidade para licitar ou contratar, pelo prazo mínimo de 3 (três) e máximo de 6 (seis) anos.</p>
<p>12.3. Na aplicação das sanções serão consideradas a natureza e a gravidade da infração cometida, as peculiaridades do caso concreto, as circunstâncias agravantes ou atenuantes e os danos que dela provierem para a Administração Pública.</p>
<p>12.4. A aplicação da sanção de declaração de inidoneidade para licitar ou contratar será precedida de análise jurídica e sua aplicação será de competência exclusiva do Presidente da Câmara Municipal de Nepomuceno.</p>
<p>12.5. As sanções de advertência, impedimento de licitar e contratar e declaração de inidoneidade poderão ser aplicadas cumulativamente com a sanção de multa, observados o contraditório e a ampla defesa, nos termos dos arts. 156 a 158 da Lei 14.133/2021.</p>

<p><strong>13. DAS HIPÓTESES DE EXTINÇÃO DO CONTRATO</strong></p>
<p>13.1. Constituirão motivos para extinção do contrato, formalmente motivada nos autos do processo, assegurados o contraditório e a ampla defesa: o não cumprimento ou cumprimento irregular de normas da contratação ou de cláusulas contratuais, especificações, projetos ou prazos; o desatendimento das determinações regulares emitidas pela autoridade designada para acompanhar e fiscalizar sua execução; a alteração social ou modificação da finalidade ou da estrutura da empresa que restrinja sua capacidade de concluir o contrato; a decretação de falência ou de insolvência civil, dissolução da sociedade ou falecimento do contratado; caso fortuito ou força maior, regularmente comprovados; razões de interesse público, justificadas pela autoridade máxima do órgão contratante; ou o não cumprimento das obrigações relativas à reserva de cargos prevista em lei.</p>
<p>13.2. A extinção do contrato poderá ser determinada por ato unilateral e escrito da Administração, exceto no caso de descumprimento decorrente de sua própria conduta, ou consensual, por acordo entre as partes, desde que haja interesse da Administração — sempre precedida de autorização escrita e fundamentada da autoridade competente e reduzida a termo no respectivo processo.</p>

<p><strong>14. DO PRAZO DE EXECUÇÃO CONTRATUAL</strong></p>
<table>
  <tbody>
    <tr><td>Natureza Continuada</td><td></td></tr>
    <tr><td>Natureza Não Continuada</td><td>X</td></tr>
    <tr><td>Justificativa</td><td>O objeto da presente contratação é classificado como de natureza não continuada, uma vez que sua execução se limita a um período determinado, com início e término definidos, não havendo necessidade de prolongamento ou renovação para a manutenção das atividades essenciais da instituição.</td></tr>
  </tbody>
</table>

<p><strong>15. APROVAÇÃO DA AUTORIDADE SUPERIOR</strong></p>
<p>15.1. Aprovo o Termo de Referência e determino à Coordenadoria de Licitações e Contratos a realização dos atos necessários à contratação do objeto.</p>
<p style="text-align:right">Nepomuceno, Minas Gerais, [data].</p>
<p style="text-align:center">${MESA_DIRETORA.presidente.nome}<br />${MESA_DIRETORA.presidente.cargo}<br />Matrícula n° ${PRESIDENTE_MATRICULA}</p>`;
}
