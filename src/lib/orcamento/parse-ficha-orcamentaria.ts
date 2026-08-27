// Parser do texto extraído (via `pdftotext -layout -enc UTF-8`) do
// relatório "Ficha Orçamentária" do Betha Sistemas — uma página por ficha
// orçamentária, com os campos de classificação (Órgão/Unidade/Subfunção/
// Programas/Projeto-Atividade/Natureza da Despesa/Recurso) e uma linha
// "Saldo da Dotação" com Dotação Inicial/Empenhado/Suplementado/Bloqueio/
// Desbloqueio.
//
// Casamento com dotacoes_orcamentarias por CÓDIGO, não por nome — o nome
// da "Natureza da Despesa" vem sem acentuação nesse relatório específico
// ("OBRAS E INSTALACOES") e o nome do "Recurso" diverge do cadastrado no
// banco pra essa Câmara ("Recursos Ordinários" no banco vs "RECURSOS NÃO
// VINCULADOS DE IMPOSTOS" no relatório, mesmo código 1500) — visto
// comparando o texto extraído real com o seed da migration 0046. Os
// códigos embutidos nas linhas "Função:"/"Subfunção:"/Recurso são limpos
// e batem exatamente com projeto_atividade_codigo/elemento_codigo/
// fonte_codigo já cadastrados (só precisa tirar os pontos).

export type FichaExtraida = {
  projetoAtividadeCodigo: string;
  elementoCodigo: string;
  fonteCodigo: string;
  elementoNome: string;
  dotacaoInicial: number;
  suplementado: number;
  empenhado: number;
  saldo: number;
};

export type ResultadoParseFichaOrcamentaria = {
  fichas: FichaExtraida[];
  avisos: string[];
};

const SEPARADOR_PAGINA = /Sistema Cont[aá]bil - Betha Sistemas\.[^\n]*\n?/g;

const NUMERO = /-?[\d.]+,\d{2}/;

function paraNumero(texto: string): number {
  return Number(texto.trim().replace(/\./g, "").replace(",", "."));
}

// "4.4.90.51.00.00.00.00" -> "449051" (só os 4 primeiros grupos, que são
// os que compõem o elemento_codigo cadastrado — o resto é padding fixo).
function codigoElemento(bruto: string): string {
  return bruto.split(".").slice(0, 4).join("");
}

// "1.500.000.0000.000" -> "1500" (só os 2 primeiros grupos).
function codigoFonte(bruto: string): string {
  return bruto.split(".").slice(0, 2).join("");
}

// "1.001" -> "1001".
function codigoSemPontos(bruto: string): string {
  return bruto.replace(/\./g, "");
}

function campoComCodigo(bloco: string, rotulo: string): { nome: string; codigo: string } | null {
  const m = bloco.match(new RegExp(`${rotulo}:\\s*(.+?)\\s{2,}([\\d.]+)\\s*$`, "m"));
  if (!m) return null;
  return { nome: m[1].trim(), codigo: m[2] };
}

function parseBlocoFicha(bloco: string, avisos: string[]): FichaExtraida | null {
  const funcao = campoComCodigo(bloco, "Fun[çc][ãa]o");
  const subfuncao = campoComCodigo(bloco, "Subfun[çc][ãa]o");
  const recurso = bloco.match(/^([\d.]+)\s*-\s*.+$/m);
  const naturezaMatch = bloco.match(/Natureza da Despesa:\s*(.+?)(?:\s{2,}|$)/);
  const saldoDotacaoMatch = bloco.match(
    new RegExp(
      `^Saldo da Dota[çc][ãa]o\\s+(${NUMERO.source})\\s+(${NUMERO.source})\\s+(${NUMERO.source})`,
      "m",
    ),
  );

  if (!funcao || !subfuncao || !recurso || !naturezaMatch || !saldoDotacaoMatch) {
    avisos.push(`Bloco sem todos os campos esperados (Função/Subfunção/Recurso/Natureza/Saldo da Dotação) — ignorado.`);
    return null;
  }

  // "Saldo da Despesa" aparece duplicado logo após a linha "Natureza da
  // Despesa:" (mesmo valor repetido por causa do reflow de coluna do
  // pdftotext) — pega o trecho entre essa linha e a linha "Recurso" e usa
  // o primeiro número encontrado.
  const inicioTrechoSaldo = bloco.indexOf(naturezaMatch[0]) + naturezaMatch[0].length;
  const fimTrechoSaldo = bloco.indexOf("\nRecurso", inicioTrechoSaldo);
  const trechoSaldo = bloco.slice(inicioTrechoSaldo, fimTrechoSaldo === -1 ? undefined : fimTrechoSaldo);
  const saldoMatch = trechoSaldo.match(NUMERO);

  if (!saldoMatch) {
    avisos.push(`Não achei o valor de "Saldo da Despesa" pra natureza "${naturezaMatch[1].trim()}" — ignorado.`);
    return null;
  }

  return {
    projetoAtividadeCodigo: codigoSemPontos(funcao.codigo),
    elementoCodigo: codigoElemento(subfuncao.codigo),
    fonteCodigo: codigoFonte(recurso[1]),
    elementoNome: naturezaMatch[1].trim(),
    dotacaoInicial: paraNumero(saldoDotacaoMatch[1]),
    empenhado: paraNumero(saldoDotacaoMatch[2]),
    suplementado: paraNumero(saldoDotacaoMatch[3]),
    saldo: paraNumero(saldoMatch[0]),
  };
}

export function parseFichaOrcamentaria(textoPdftotext: string): ResultadoParseFichaOrcamentaria {
  const blocos = textoPdftotext.split(SEPARADOR_PAGINA).filter((b) => b.includes("Natureza da Despesa:"));
  const avisos: string[] = [];
  const fichas: FichaExtraida[] = [];

  for (const bloco of blocos) {
    const ficha = parseBlocoFicha(bloco, avisos);
    if (ficha) fichas.push(ficha);
  }

  return { fichas, avisos };
}
