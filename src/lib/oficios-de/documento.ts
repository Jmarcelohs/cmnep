export const NOME_CAMARA = "Câmara Municipal de Nepomuceno";
export const CIDADE = "Nepomuceno";

// Ofícios do Diretor Executivo saem sempre assinados por essa pessoa —
// diferente dos Ofícios da Secretaria (assinados pelo Presidente), essa aba
// é de uso pessoal do Diretor Executivo (ver migration 0043).
export const DIRETOR_EXECUTIVO_NOME = "João Marcelo Hipólito de Souza";
export const DIRETOR_EXECUTIVO_CARGO = "Diretor Executivo";

export function numeroOficioDEFormatado({ numero, ano }: { numero: string; ano: number }) {
  return `OFÍCIO Nº ${numero}/${ano}/DE/CMN`;
}

// Campo de texto livre (não uma lista fechada) — nem todo ofício do Diretor
// Executivo é endereçado a uma pessoa (ex.: ofícios reais nº 002, 005, 006,
// 007, 009 e 010/2026/DE/CMN vão pro "Departamento de Arrecadação", um setor
// do Executivo, sem tratamento nenhum) — ver migration 0044. Guarda direto o
// texto que aparece depois de "Ao " no PDF; essas são só sugestões pro
// datalist do formulário.
export const SUGESTOES_TRATAMENTO_DE = ["Ilmo. Sr.", "Ilma. Sra.", "Exmo. Sr.", "Exma. Sra."];

// Sugestão de saudação a partir do cargo do destinatário e do gênero
// implícito no tratamento digitado (procura por "Sra"/"Senhora") — sempre
// editável pelo redator, mesma filosofia da Secretaria (ver
// src/lib/oficios/documento.ts): a redação real varia mais do que dá pra
// prever (ex.: "Senhor Controlador," no ofício nº 014/2026/DE/CMN).
export function saudacaoSugeridaDE(tratamento: string, cargo: string): string {
  const feminino = /sra\.?$|senhora/i.test(tratamento.trim());
  const primeiraPalavra = (cargo || "").trim().split(/\s+/)[0];
  const tituloDestino = feminino ? "Senhora" : "Senhor";
  return primeiraPalavra ? `${tituloDestino} ${primeiraPalavra},` : `${tituloDestino},`;
}
