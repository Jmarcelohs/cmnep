// Divide um corpo em HTML em páginas — cada <PaginaA4> tem altura fixa
// (297mm), então conteúdo que a estoura não "empurra" a página seguinte
// pra baixo, só sobrepõe visualmente o timbrado dela (bug visto ao vivo
// com a tabela de itens do TR). paginarTextoCorrido (src/lib/pdf/
// paginacao.ts) resolve isso pra texto corrido simples; esta função
// generaliza a mesma ideia (estimativa de altura por bloco, sempre
// preferindo uma página a mais a arriscar estourar) pra conteúdo misto
// (parágrafo + tabela) — usada pelo TR e pelo DFD, mesma margem/fonte
// (20mm/20mm, 42mm/35mm, 11pt Arial) por serem do mesmo timbrado.
const CARACTERES_POR_LINHA = 95; // 11pt cabe um pouco mais por linha que os 88 do padrão 12pt
const CARACTERES_POR_LINHA_CELULA = 85; // uma célula de tabela tem menos largura útil que a página inteira
export const ALTURA_LINHA_MM = 6.3;
const ALTURA_UTIL_PAGINA_MM = 220; // 297mm - 42mm (topo) - 35mm (rodapé)
const ALTURA_LINHA_TABELA_MM = 11; // altura mínima de uma linha de tabela (padding + 1 linha de texto)

type Bloco = { html: string; alturaMm: number };
type Faixa = { inicio: number; fim: number };

function estimarAlturaParagrafo(html: string): number {
  const texto = html.replace(/<[^>]+>/g, " ");
  const linhas = Math.ceil(texto.length / CARACTERES_POR_LINHA) + 0.5;
  return linhas * ALTURA_LINHA_MM;
}

// Encontra os trechos [inicio,fim) de cada ocorrência de nível superior
// de uma tag — uma ocorrência aninhada dentro de outra do MESMO nome não
// conta como um novo trecho (ex.: a tabela de itens aninhada dentro de
// uma célula de uma "caixa" do DFD via caixaHtml, ver documento-comum.ts,
// não deve ser confundida com a tabela externa da caixa).
function faixasDeTag(html: string, tag: string): Faixa[] {
  const regex = new RegExp(`<${tag}\\b[^>]*>|<\\/${tag}>`, "gi");
  const faixas: Faixa[] = [];
  let profundidade = 0;
  let inicioAtual = -1;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html))) {
    if (!m[0].startsWith("</")) {
      if (profundidade === 0) inicioAtual = m.index;
      profundidade++;
    } else {
      profundidade--;
      if (profundidade === 0 && inicioAtual !== -1) {
        faixas.push({ inicio: inicioAtual, fim: m.index + m[0].length });
        inicioAtual = -1;
      }
    }
  }
  return faixas;
}

// Encontra as ocorrências de `tagAlvo` (aceita "td|th" pra cobrir os
// dois) que estão exatamente no nível de aninhamento de <table> indicado
// — usado pra achar as <tr> de nível superior de UMA tabela (nível 1:
// direto dentro dela, ignorando as de uma tabela aninhada numa célula) e
// as <td>/<th> de nível superior de uma <tr> (nível 0: fora de qualquer
// tabela aninhada nessa linha). Sem isso, uma tabela aninhada dentro de
// uma célula faria suas próprias linhas/células serem contadas como se
// fossem da tabela de fora.
function faixasPorProfundidadeDeTabela(html: string, tagAlvo: string, profundidadeAlvo: number): Faixa[] {
  const regex = new RegExp(`<table\\b[^>]*>|<\\/table>|<(?:${tagAlvo})\\b[^>]*>|<\\/(?:${tagAlvo})>`, "gi");
  const faixas: Faixa[] = [];
  let profundidadeTabela = 0;
  let inicioAtual = -1;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html))) {
    const tagTexto = m[0].toLowerCase();
    if (tagTexto.startsWith("<table")) {
      profundidadeTabela++;
    } else if (tagTexto === "</table>") {
      profundidadeTabela--;
    } else if (!tagTexto.startsWith("</") && profundidadeTabela === profundidadeAlvo && inicioAtual === -1) {
      inicioAtual = m.index;
    } else if (tagTexto.startsWith("</") && profundidadeTabela === profundidadeAlvo && inicioAtual !== -1) {
      faixas.push({ inicio: inicioAtual, fim: m.index + m[0].length });
      inicioAtual = -1;
    }
  }
  return faixas;
}

function linhasNivelSuperior(tableHtml: string): Faixa[] {
  return faixasPorProfundidadeDeTabela(tableHtml, "tr", 1);
}

function celulasNivelSuperior(trHtml: string): Faixa[] {
  return faixasPorProfundidadeDeTabela(trHtml, "td|th", 0);
}

// CARACTERES_POR_LINHA_CELULA é calibrado pra uma célula "de referência"
// (~2 colunas, tipo as tabelas de checkbox do TR) — uma linha com mais
// colunas divide a mesma largura entre mais células, então cada uma
// cabe menos texto por linha. Amortecido por raiz quadrada (não divisão
// direta por N) pra não subestimar demais colunas estreitas de rótulo/
// número ao lado de uma larga (ex.: ITEM/UNID./QUANT. ao lado de OBJETO
// na tabela "DEMANDA" — ver tabelaItensHtml em documento-comum.ts):
// N=2 → ~85 (sem mudança), N=6 → ~35, batendo com o que o objeto real de
// um DFD (texto longo, 6 colunas) quebra na prática (visto comparando
// com o PDF renderizado — a estimativa antiga, flat 85 pra qualquer N,
// subestimava a altura da tabela de itens e deixava a caixa "1. DO
// OBJETO" estourar a página, cortando o texto no rodapé do timbrado).
function caracteresPorLinhaCelula(numeroColunas: number): number {
  return Math.max(25, Math.round(CARACTERES_POR_LINHA_CELULA / Math.sqrt(Math.max(1, numeroColunas))));
}

function estimarAlturaTextoCelula(texto: string, numeroColunas: number): number {
  const limpo = texto.trim();
  if (!limpo) return ALTURA_LINHA_TABELA_MM;
  const linhas = Math.ceil(limpo.length / caracteresPorLinhaCelula(numeroColunas)) + 0.3;
  return Math.max(ALTURA_LINHA_TABELA_MM, linhas * ALTURA_LINHA_MM);
}

// Altura de uma célula: se ela contém uma tabela aninhada (caso do
// item "1. DO OBJETO" do DFD, que embute a tabela DEMANDA dentro da
// mesma caixa — ver caixaHtml), a altura da célula é a da tabela
// aninhada; senão, é o texto da célula tratado como um parágrafo.
// `numeroColunas` é o número de células irmãs na mesma linha (afeta só
// a estimativa de texto solto — a tabela aninhada já calcula a própria
// largura a partir das colunas dela mesma).
function estimarAlturaCelula(celulaHtml: string, numeroColunas: number): number {
  const conteudo = celulaHtml.replace(/^<t[dh][^>]*>/i, "").replace(/<\/t[dh]>$/i, "");
  const faixaTabela = faixasDeTag(conteudo, "table")[0];
  if (!faixaTabela) {
    return estimarAlturaTextoCelula(conteudo.replace(/<[^>]+>/g, " "), numeroColunas);
  }
  const antes = conteudo.slice(0, faixaTabela.inicio).replace(/<[^>]+>/g, " ").trim();
  const depois = conteudo.slice(faixaTabela.fim).replace(/<[^>]+>/g, " ").trim();
  const alturaAntes = antes ? estimarAlturaTextoCelula(antes, numeroColunas) : 0;
  const alturaDepois = depois ? estimarAlturaTextoCelula(depois, numeroColunas) : 0;
  return alturaAntes + estimarAlturaTabela(conteudo.slice(faixaTabela.inicio, faixaTabela.fim)) + alturaDepois;
}

// A altura de uma linha é a da célula mais alta dela (mesma regra do
// navegador pra <tr>), com uma pequena folga de padding.
function estimarAlturaLinha(trHtml: string): number {
  const celulas = celulasNivelSuperior(trHtml);
  if (celulas.length === 0) return ALTURA_LINHA_TABELA_MM;
  const alturas = celulas.map((f) => estimarAlturaCelula(trHtml.slice(f.inicio, f.fim), celulas.length));
  return Math.max(...alturas) + 2;
}

function linhasComAltura(tableHtml: string): Bloco[] {
  return linhasNivelSuperior(tableHtml).map((f) => {
    const html = tableHtml.slice(f.inicio, f.fim);
    return { html, alturaMm: estimarAlturaLinha(html) };
  });
}

export function estimarAlturaTabela(tableHtml: string): number {
  const alturaLinhas = linhasComAltura(tableHtml).reduce((soma, linha) => soma + linha.alturaMm, 0);
  return alturaLinhas + 8;
}

// Divide o documento em blocos de nível superior — só <p>...</p> e
// <table>...</table> aparecem soltos no HTML gerado pelos montadores
// deste módulo (ver documento-tr.ts, documento-dfd.ts); um <p> que
// apareça DENTRO de uma <table> (ex.: o bloco de assinatura nas seções
// 6/7 do DFD, dentro de uma célula de caixaHtml) não conta como bloco de
// nível superior — é conteúdo da tabela, não um parágrafo solto.
export function dividirBlocos(html: string): Bloco[] {
  const regex = /<table\b[^>]*>|<\/table>|<p\b[^>]*>|<\/p>/gi;
  const blocos: Bloco[] = [];
  let profundidadeTabela = 0;
  let blocoInicio = -1;
  let blocoTipo: "p" | "table" | null = null;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html))) {
    const tagTexto = m[0].toLowerCase();
    if (tagTexto.startsWith("<table")) {
      if (profundidadeTabela === 0 && blocoTipo === null) {
        blocoInicio = m.index;
        blocoTipo = "table";
      }
      profundidadeTabela++;
    } else if (tagTexto === "</table>") {
      profundidadeTabela--;
      if (profundidadeTabela === 0 && blocoTipo === "table") {
        const trecho = html.slice(blocoInicio, m.index + m[0].length);
        blocos.push({ html: trecho, alturaMm: estimarAlturaTabela(trecho) });
        blocoTipo = null;
      }
    } else if (profundidadeTabela === 0 && tagTexto.startsWith("<p") && blocoTipo === null) {
      blocoInicio = m.index;
      blocoTipo = "p";
    } else if (profundidadeTabela === 0 && tagTexto === "</p>" && blocoTipo === "p") {
      const trecho = html.slice(blocoInicio, m.index + m[0].length);
      blocos.push({ html: trecho, alturaMm: estimarAlturaParagrafo(trecho) });
      blocoTipo = null;
    }
  }
  return blocos;
}

// Quando uma única "caixa" (tabela de nível superior) é, sozinha, mais
// alta que uma página inteira — ex.: o DFD com uma justificativa real
// digna longa junto da tabela de itens na mesma caixa —, não dá pra
// tratá-la como um bloco atômico: precisa abrir na página atual e
// continuar (com a mesma borda, reaberta) na(s) página(s) seguinte(s),
// exatamente como o modelo real em Word faz quando uma tabela quebra
// entre páginas. Cada fragmento vira uma <table><tbody> própria com as
// linhas que couberem.
function dividirTabelaEmFragmentos(tableHtml: string, alturaDisponivelMm: number): Bloco[] {
  const linhas = linhasComAltura(tableHtml);
  const fragmentos: Bloco[] = [];
  let linhasAtuais: string[] = [];
  let alturaAtual = 8; // mesmo acréscimo fixo usado em estimarAlturaTabela
  let orcamento = alturaDisponivelMm;
  for (const linha of linhas) {
    if (linhasAtuais.length > 0 && alturaAtual + linha.alturaMm > orcamento) {
      fragmentos.push({ html: `<table><tbody>${linhasAtuais.join("")}</tbody></table>`, alturaMm: alturaAtual });
      linhasAtuais = [];
      alturaAtual = 8;
      orcamento = ALTURA_UTIL_PAGINA_MM;
    }
    linhasAtuais.push(linha.html);
    alturaAtual += linha.alturaMm;
  }
  if (linhasAtuais.length > 0) {
    fragmentos.push({ html: `<table><tbody>${linhasAtuais.join("")}</tbody></table>`, alturaMm: alturaAtual });
  }
  return fragmentos;
}

export function paginarBlocosHtml(corpoHtml: string): string[] {
  const blocos = dividirBlocos(corpoHtml);
  const paginas: string[] = [];
  let paginaAtual: string[] = [];
  let alturaAtual = 0;

  for (const bloco of blocos) {
    if (paginaAtual.length > 0 && alturaAtual + bloco.alturaMm > ALTURA_UTIL_PAGINA_MM) {
      paginas.push(paginaAtual.join(""));
      paginaAtual = [];
      alturaAtual = 0;
    }
    if (bloco.alturaMm > ALTURA_UTIL_PAGINA_MM && bloco.html.startsWith("<table")) {
      const alturaDisponivel = ALTURA_UTIL_PAGINA_MM - alturaAtual;
      const fragmentos = dividirTabelaEmFragmentos(bloco.html, alturaDisponivel);
      for (const fragmento of fragmentos) {
        if (paginaAtual.length > 0 && alturaAtual + fragmento.alturaMm > ALTURA_UTIL_PAGINA_MM) {
          paginas.push(paginaAtual.join(""));
          paginaAtual = [];
          alturaAtual = 0;
        }
        paginaAtual.push(fragmento.html);
        alturaAtual += fragmento.alturaMm;
      }
      continue;
    }
    paginaAtual.push(bloco.html);
    alturaAtual += bloco.alturaMm;
  }
  if (paginaAtual.length > 0) paginas.push(paginaAtual.join(""));
  if (paginas.length === 0) paginas.push("");
  return paginas;
}
