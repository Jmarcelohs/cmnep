// Divide o corpo em HTML do TR em páginas — cada <PaginaA4> tem altura
// fixa (297mm), então conteúdo que a estoura não "empurra" a página
// seguinte pra baixo, só sobrepõe visualmente o timbrado dela (bug visto
// ao vivo com a tabela de itens). paginarTextoCorrido (src/lib/pdf/
// paginacao.ts) resolve isso pra texto corrido simples, mas o TR mistura
// parágrafo com tabela — esta função generaliza a mesma ideia (estimativa
// de altura por bloco, sempre preferindo uma página a mais a arriscar
// estourar) pra esse conteúdo misto.
const CARACTERES_POR_LINHA = 95; // 11pt (TR) cabe um pouco mais por linha que os 88 do padrão 12pt
const ALTURA_LINHA_MM = 6.3;
const ALTURA_UTIL_PAGINA_MM = 220; // 297mm - 42mm (topo) - 35mm (rodapé), igual TrConteudo
const ALTURA_LINHA_TABELA_MM = 11; // altura aproximada de uma linha de tabela (padding + texto)

type Bloco = { html: string; alturaMm: number };

function estimarAlturaParagrafo(html: string): number {
  const texto = html.replace(/<[^>]+>/g, " ");
  const linhas = Math.ceil(texto.length / CARACTERES_POR_LINHA) + 0.5;
  return linhas * ALTURA_LINHA_MM;
}

function estimarAlturaTabela(html: string): number {
  const linhas = (html.match(/<tr/g) ?? []).length;
  return linhas * ALTURA_LINHA_TABELA_MM + 8;
}

// Divide em blocos de nível superior — só <p>...</p> e <table>...</table>
// aparecem no HTML gerado por montarCorpoTR (ver documento-tr.ts).
function dividirBlocos(html: string): Bloco[] {
  const partes = html.match(/<table[\s\S]*?<\/table>|<p[^>]*>[\s\S]*?<\/p>/g) ?? [];
  return partes.map((parte) => ({
    html: parte,
    alturaMm: parte.startsWith("<table") ? estimarAlturaTabela(parte) : estimarAlturaParagrafo(parte),
  }));
}

export function paginarTR(corpoHtml: string): string[] {
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
    paginaAtual.push(bloco.html);
    alturaAtual += bloco.alturaMm;
  }
  if (paginaAtual.length > 0) paginas.push(paginaAtual.join(""));
  if (paginas.length === 0) paginas.push("");
  return paginas;
}
