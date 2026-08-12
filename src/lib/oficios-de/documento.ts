import type { TratamentoOficio } from "@/lib/supabase/database.types";

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

// O modelo real do Diretor Executivo abrevia o tratamento no endereçamento
// ("Ao Ilmo. Sr.") — diferente do Ofício da Secretaria, que escreve por
// extenso ("Ao Excelentíssimo Senhor"). Reaproveita o mesmo TratamentoOficio
// (mesmas 4 opções), só muda a forma de exibir nesse timbrado específico.
const ABREVIACAO_TRATAMENTO: Record<TratamentoOficio, string> = {
  "Excelentíssimo Senhor": "Exmo. Sr.",
  "Excelentíssima Senhora": "Exma. Sra.",
  "Ilustríssimo Senhor": "Ilmo. Sr.",
  "Ilustríssima Senhora": "Ilma. Sra.",
};

export function abreviarTratamento(tratamento: TratamentoOficio): string {
  return ABREVIACAO_TRATAMENTO[tratamento];
}

// Sugestão de saudação a partir do cargo do destinatário e do gênero
// implícito no tratamento escolhido (Senhor/Senhora) — sempre editável pelo
// redator, mesma filosofia da Secretaria (ver src/lib/oficios/documento.ts):
// a redação real varia mais do que dá pra prever (ex.: "Senhor Controlador,"
// no ofício nº 014/2026/DE/CMN).
export function saudacaoSugeridaDE(tratamento: TratamentoOficio, cargo: string): string {
  const feminino = tratamento.includes("Senhora");
  const primeiraPalavra = (cargo || "").trim().split(/\s+/)[0];
  const tituloDestino = feminino ? "Senhora" : "Senhor";
  return primeiraPalavra ? `${tituloDestino} ${primeiraPalavra},` : `${tituloDestino},`;
}
