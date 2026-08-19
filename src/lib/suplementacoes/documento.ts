import { dataPorExtenso, formatarMoeda, valorPorExtenso } from "@/lib/pdf/formato";
import type { Database } from "@/lib/supabase/database.types";

export const NOME_CAMARA = "Câmara Municipal de Nepomuceno";
export const CIDADE = "Nepomuceno";

// Composição da Mesa Diretora que assina o Ato — fixa por biênio, mesma
// convenção de PRESIDENTE_PADRAO (src/lib/reembolso/documento.ts) e
// DIRETOR_EXECUTIVO_NOME (src/lib/oficios-de/documento.ts): não é lido de
// uma tabela dinâmica porque o documento gerado precisa ficar definitivo
// mesmo que a composição da Mesa mude depois.
export const MESA_DIRETORA = {
  presidente: { nome: "Tullio Ian Marangoni de Morais", cargo: "Presidente da Câmara Municipal" },
  vicePresidente: { nome: "Marcos Memento", cargo: "Vice-Presidente da Câmara Municipal" },
  secretario: { nome: "Thuler Adriano Spuri", cargo: "Secretário da Câmara Municipal" },
  bienio: "Biênio 2025/2026",
};

// Assina o Decreto que ratifica o Ato — mesmo padrão de PRESIDENTE_PADRAO,
// nome fixo em vez de lido da tabela "autoridades" (que serve pro
// endereçamento de ofícios, um uso diferente).
export const PREFEITO_NOME = "Elias Natal Lima de Menezes";
export const PREFEITO_CARGO = "Prefeito Municipal";

export type DotacaoOrcamentaria = Database["public"]["Tables"]["dotacoes_orcamentarias"]["Row"];

// Numeral romano só até um teto bem folgado pro uso real (nº de itens de
// um artigo) — não precisa cobrir números grandes.
const ROMANOS: [number, string][] = [
  [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];
export function numeroRomano(n: number): string {
  let resto = n;
  let resultado = "";
  for (const [valor, simbolo] of ROMANOS) {
    while (resto >= valor) {
      resultado += simbolo;
      resto -= valor;
    }
  }
  return resultado || "I";
}

// As 7 linhas da classificação orçamentária completa de uma ficha, na
// mesma ordem impressa num Ato/Decreto real (órgão, unidade, subfunção,
// programa, projeto/atividade, elemento de despesa, fonte de recurso) —
// cada linha é o código acumulado até aquele nível + o nome. A última
// linha (fonte) ganha o valor formatado à parte, porque no modelo real
// ela aparece duas vezes: uma sem valor (na classificação) e outra com
// (ver montarLinhasFicha em oficio/decreto-conteudo).
export function segmentosFicha(dotacao: DotacaoOrcamentaria) {
  const orgao = dotacao.orgao_codigo;
  const unidade = `${orgao}.${dotacao.unidade_codigo}`;
  const subfuncao = `${unidade}.${dotacao.subfuncao_codigo}`;
  const programa = `${subfuncao}.${dotacao.programa_codigo}`;
  const projetoAtividade = `${programa}.${dotacao.projeto_atividade_codigo}`;
  const elemento = `${projetoAtividade}.${dotacao.elemento_codigo}`;
  const fonte = `${elemento}.${dotacao.fonte_codigo}`;

  return [
    { codigo: orgao, nome: dotacao.orgao_nome },
    { codigo: unidade, nome: dotacao.unidade_nome },
    { codigo: subfuncao, nome: dotacao.subfuncao_nome },
    { codigo: programa, nome: dotacao.programa_nome },
    { codigo: projetoAtividade, nome: dotacao.projeto_atividade_nome },
    { codigo: elemento, nome: dotacao.elemento_nome },
    { codigo: fonte, nome: dotacao.fonte_nome },
  ];
}

// Rótulo pro <select> de ficha no formulário — ex.: "Ficha 22 —
// 01.01.031.0001.2001.339039.1500 — Outros Serviços de Terceiros - Pessoa
// Jurídica (Manutenção das Atividades do Legislativo Municipal)". Mostra a
// codificação orçamentária completa (código acumulado até a fonte de
// recurso) em vez do saldo de referência — o saldo é só uma foto do
// momento da importação, não o dado que ajuda a conferir se é a ficha
// certa (ver [[camara-nepomuceno-*]] sobre "só referência" no import).
export function rotuloFicha(dotacao: DotacaoOrcamentaria): string {
  const segmentos = segmentosFicha(dotacao);
  const codigoCompleto = segmentos[segmentos.length - 1].codigo;
  return `Ficha ${dotacao.ficha} — ${codigoCompleto} — ${dotacao.elemento_nome} (${dotacao.projeto_atividade_nome})`;
}

// "cinquenta e três mil reais" (minúsculo, pra encaixar depois de
// "no valor total de R$53.000,00 (...)") — valorPorExtenso devolve com
// inicial maiúscula (uso normal em início de frase).
export function valorPorExtensoMinusculo(valor: number): string {
  const texto = valorPorExtenso(valor);
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

export type ItemSuplementacao = {
  valor: number;
  dotacao: DotacaoOrcamentaria;
};

// Um bloco "I / Ficha N / <7 linhas da classificação> / (linha em branco) /
// Total: R$X" — tudo num <p> só com <br> entre as linhas (não um <p> por
// linha) pra não abrir espaço extra de parágrafo entre elas, mas com um
// <br><br> antes do Total pra separar visualmente do resto (pedido
// explícito — sem isso ficava tudo colado). É a mesma informação do modelo
// real, só sem o efeito visual de pontilhado antes do valor (não dá pra
// reproduzir isso com as tags/estilos que o editor de texto rico e o
// sanitizador permitem — ver TAGS_PERMITIDAS em sanitizar-html.ts) — vira
// texto puro "Total: R$X" pra caber no conjunto de tags aceitas, já que
// esse texto agora pode ser editado livremente (não é mais gerado à parte).
//
// font-size:10pt (menor que o resto do corpo, 12pt) — sem isso, o nome do
// projeto/atividade mais longo (ex.: "Aquisição de Equipamentos e
// Materiais Permanentes e Veículos") estourava a largura da página e
// quebrava pra uma segunda linha, ficando com aparência de erro de
// digitação. Mesma convenção de fonte reduzida pra dado denso/tabular já
// usada nos outros templates de PDF do sistema (9-11pt).
function linhaItemHtml(item: ItemSuplementacao, indice: number): string {
  const linhas = segmentosFicha(item.dotacao);
  const ultima = linhas[linhas.length - 1];
  const partes = [
    numeroRomano(indice + 1),
    `Ficha ${item.dotacao.ficha}`,
    ...linhas.map((l) => `${l.codigo} ${l.nome}`),
    `${ultima.codigo} ${ultima.nome} ${formatarMoeda(item.valor)}`,
  ];
  return `<p style="font-size:10pt">${partes.join("<br>")}<br><br>Total: ${formatarMoeda(item.valor)}</p>`;
}

function corpoArtigoHtml(itens: ItemSuplementacao[], introHtml: string): string {
  const totalGeral = itens.reduce((soma, i) => soma + i.valor, 0);
  const itensHtml = itens.map((item, i) => linhaItemHtml(item, i)).join("");
  const totalGeralHtml =
    itens.length > 1 ? `<p><strong>Total Geral: ${formatarMoeda(totalGeral)}</strong></p>` : "";
  return introHtml + itensHtml + totalGeralHtml;
}

// HTML padrão (título + ementa + preâmbulo + Art.1º/2º/3º) pro corpo do
// Ato — pré-preenche o editor de texto rico na hora de criar/editar uma
// suplementação e serve de "restaurar padrão" e de fallback pra registros
// salvos antes da suplementação ganhar texto editável (ver migration
// 0048). Compatível só com as tags que o sanitizador aceita (ver
// sanitizar-html.ts) — sem isso, o texto salvo perderia a formatação ao
// passar pelo sanitizador antes de virar PDF.
export function montarCorpoAtoPadrao({
  dataAto,
  itensDestino,
  itensOrigem,
}: {
  dataAto: string;
  itensDestino: ItemSuplementacao[];
  itensOrigem: ItemSuplementacao[];
}): string {
  const valorTotal = itensDestino.reduce((soma, i) => soma + i.valor, 0);
  const dataFormatada = dataAto ? dataPorExtenso(dataAto).toUpperCase() : "___";

  const titulo = `<p style="text-align:center;font-size:18pt"><strong>ATO DA MESA DIRETORA DE ${dataFormatada}</strong></p>`;
  const subtitulo =
    '<p style="text-align:right"><strong>Abre crédito suplementar no Orçamento vigente da Câmara Municipal.</strong></p>';
  const preambulo =
    '<p style="text-indent:1.25cm;text-align:justify">A Mesa Diretora da Câmara Municipal de Nepomuceno, conforme lhe faculta o art. 67, inciso VI da Lei Orgânica Municipal, por determinação do art. 42 da Lei Federal 4.320/64, RESOLVE:</p>';

  const art1Intro = `<p style="text-indent:1.25cm;text-align:justify"><strong>Art.1º</strong> Abrir crédito adicional do tipo suplementar no orçamento vigente da Câmara Municipal de Nepomuceno no valor total de ${formatarMoeda(valorTotal)} (${valorPorExtensoMinusculo(valorTotal)}) sob as seguintes classificações orçamentárias:</p>`;
  const art2Intro = `<p style="text-indent:1.25cm;text-align:justify"><strong>Art.2º</strong> A origem dos recursos dos créditos suplementares autorizados no art. 1º que totaliza ${formatarMoeda(valorTotal)} (${valorPorExtensoMinusculo(valorTotal)}) será a anulação parcial das seguintes dotações do Orçamento da Câmara Municipal de Nepomuceno:</p>`;
  const art3 =
    '<p style="text-indent:1.25cm;text-align:justify"><strong>Art.3º</strong> Este ato entra em vigor na data da sua publicação, revogando as disposições em contrário.</p>';

  return (
    titulo +
    subtitulo +
    preambulo +
    corpoArtigoHtml(itensDestino, art1Intro) +
    corpoArtigoHtml(itensOrigem, art2Intro) +
    art3
  );
}

// Mesma lógica do Ato, com a redação do Decreto (Prefeito/"DECRETA",
// sem ponto final na ementa — reproduz o modelo real).
export function montarCorpoDecretoPadrao({
  numeroDecreto,
  dataDecreto,
  itensDestino,
  itensOrigem,
}: {
  numeroDecreto: string;
  dataDecreto: string;
  itensDestino: ItemSuplementacao[];
  itensOrigem: ItemSuplementacao[];
}): string {
  const valorTotal = itensDestino.reduce((soma, i) => soma + i.valor, 0);
  const dataFormatada = dataDecreto ? dataPorExtenso(dataDecreto).toUpperCase() : "___";
  const numero = numeroDecreto.trim() || "___";

  const titulo = `<p style="text-align:center;font-size:18pt"><strong>DECRETO Nº ${numero} DE ${dataFormatada}</strong></p>`;
  const subtitulo =
    '<p style="text-align:right"><strong>Abre crédito adicional suplementar no Orçamento vigente da Câmara Municipal</strong></p>';
  const preambulo =
    '<p style="text-indent:1.25cm;text-align:justify">O Prefeito Municipal de Nepomuceno, no uso de suas atribuições legais e ratificando ato da mesa diretora da Câmara Municipal, DECRETA:</p>';

  const art1Intro = `<p style="text-indent:1.25cm;text-align:justify"><strong>Art.1º</strong> Abrir crédito adicional do tipo suplementar no orçamento vigente da Câmara Municipal de Nepomuceno no valor total de ${formatarMoeda(valorTotal)} (${valorPorExtensoMinusculo(valorTotal)}) sob as seguintes classificações orçamentárias:</p>`;
  const art2Intro = `<p style="text-indent:1.25cm;text-align:justify"><strong>Art.2º</strong> A origem dos recursos dos créditos suplementares autorizados no art. 1º que totaliza ${formatarMoeda(valorTotal)} (${valorPorExtensoMinusculo(valorTotal)}) será a anulação parcial das seguintes dotações do Orçamento da Câmara Municipal de Nepomuceno:</p>`;
  const art3 =
    '<p style="text-indent:1.25cm;text-align:justify"><strong>Art.3º</strong> Este decreto entra em vigor na data da sua publicação, revogando as disposições em contrário.</p>';

  return (
    titulo +
    subtitulo +
    preambulo +
    corpoArtigoHtml(itensDestino, art1Intro) +
    corpoArtigoHtml(itensOrigem, art2Intro) +
    art3
  );
}
