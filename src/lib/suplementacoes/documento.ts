import { formatarMoeda, valorPorExtenso } from "@/lib/pdf/formato";
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

// Rótulo pro <select> de ficha no formulário — ex.: "Ficha 22 — Outros
// Serviços de Terceiros - Pessoa Jurídica (Manutenção das Atividades do
// Legislativo Municipal) — saldo ref.: R$4.601,86".
export function rotuloFicha(dotacao: DotacaoOrcamentaria): string {
  const saldo =
    dotacao.saldo_referencia != null ? ` — saldo ref.: ${formatarMoeda(dotacao.saldo_referencia)}` : "";
  return `Ficha ${dotacao.ficha} — ${dotacao.elemento_nome} (${dotacao.projeto_atividade_nome})${saldo}`;
}

// "cinquenta e três mil reais" (minúsculo, pra encaixar depois de
// "no valor total de R$53.000,00 (...)") — valorPorExtenso devolve com
// inicial maiúscula (uso normal em início de frase).
export function valorPorExtensoMinusculo(valor: number): string {
  const texto = valorPorExtenso(valor);
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}
