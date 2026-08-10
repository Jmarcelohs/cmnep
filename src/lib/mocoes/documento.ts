import { dataPorExtenso } from "@/lib/pdf/formato";
import type { GeneroVereador, TipoMocao, Tratamento } from "@/lib/supabase/database.types";

export const NOME_CAMARA = "Câmara Municipal de Nepomuceno";
export const UF = "MG";

// Art. 117 do Regimento Interno da Câmara Municipal de Nepomuceno.
export const LABEL_TIPO_MOCAO: Record<TipoMocao, string> = {
  louvor: "Moção de Louvor",
  congratulacoes: "Moção de Congratulação",
  pesar: "Moção de Pesar",
  repudio: "Moção de Repúdio",
};

// Tipos com timbrado/redação já conferidos contra um documento real da
// Câmara — os demais ficam escondidos do formulário de criação (ver
// mocao-form.tsx) até o usuário fornecer o modelo real de cada um; exibir
// um PDF com redação inventada seria pior do que não oferecer a opção.
export const TIPOS_MOCAO_DISPONIVEIS: TipoMocao[] = ["congratulacoes", "pesar"];

export type VereadorSignatario = {
  id: string;
  nome: string;
  partido: string | null;
  genero: GeneroVereador;
  presidente: boolean;
  assinaturaCaminho: string | null;
};

// Junta uma lista de nomes em texto corrido no padrão "A, B e C".
export function listaComE(nomes: string[]): string {
  if (nomes.length === 0) return "";
  if (nomes.length === 1) return nomes[0];
  return `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

// Ordem de assinatura observada nos dois modelos reais analisados
// (Congratulação e Pesar): todo mundo em ordem alfabética pelo nome,
// EXCETO o Presidente, que sempre assina por último — mesmo quando o
// nome dele viria antes de outros na ordem alfabética.
export function ordenarSignatarios(signatarios: VereadorSignatario[]): VereadorSignatario[] {
  const semPresidente = signatarios
    .filter((v) => !v.presidente)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  const presidente = signatarios.find((v) => v.presidente);
  return presidente ? [...semPresidente, presidente] : semPresidente;
}

// O Presidente assina toda moção por exigência do art. 117 do Regimento
// Interno, esteja ele listado como autor/associado ou não — devolve os
// associados com o Presidente incluído (sem duplicar, se ele já for o
// autor ou já estiver na lista). Usado tanto na prévia do formulário
// quanto no PDF, pra prévia e PDF final nunca divergirem em quem assina.
export function associadosComPresidenteObrigatorio(
  autor: { id: string },
  associados: VereadorSignatario[],
  presidenteAtual: VereadorSignatario | null,
): VereadorSignatario[] {
  if (!presidenteAtual) return associados;
  const jaIncluido =
    presidenteAtual.id === autor.id || associados.some((a) => a.id === presidenteAtual.id);
  return jaIncluido ? associados : [...associados, presidenteAtual];
}

export function legendaAssinatura(v: VereadorSignatario): string {
  if (v.presidente) return `Presidente da ${NOME_CAMARA}`;
  return `${v.genero} da ${NOME_CAMARA}${v.partido ? ` – ${v.partido}` : ""}`;
}

export type SegmentoMocao = { texto: string; negrito: boolean };

function contracaoTratamento(tratamento: Tratamento): "do Senhor" | "da Senhora" {
  return tratamento === "Sra." ? "da Senhora" : "do Senhor";
}

function contracaoAutor(genero: GeneroVereador): "do vereador" | "da vereadora" {
  return genero === "Vereadora" ? "da vereadora" : "do vereador";
}

// Frase de abertura da Moção de Congratulação, em segmentos (texto normal
// / nome em negrito) pra renderizar de forma idêntica na prévia do
// formulário e no PDF. Reproduz a redação de uma Moção de Congratulação
// real já emitida pela Câmara (Camila Rezende Batista Moreira, 03/08/2026)
// — "a requerimento do Vereador X, em associação dos Vereadores Y, Z...
// homenageia".
export function aberturaCongratulacaoSegmentos({
  autorNome,
  associadosNomes,
}: {
  autorNome: string;
  associadosNomes: string[];
}): SegmentoMocao[] {
  const segmentos: SegmentoMocao[] = [
    {
      texto:
        "A Câmara Municipal de Nepomuceno, no uso de suas atribuições legais e a requerimento do Vereador ",
      negrito: false,
    },
    { texto: (autorNome || "[autor]").toUpperCase(), negrito: true },
  ];

  if (associadosNomes.length > 0) {
    segmentos.push({ texto: ", em associação dos Vereadores ", negrito: false });
    segmentos.push({
      texto: listaComE(associadosNomes.map((n) => n.toUpperCase())),
      negrito: true,
    });
  }

  segmentos.push({ texto: " homenageia", negrito: false });
  return segmentos;
}

// Linha de endereçamento da Moção de Pesar — "À Família do Senhor X."
export function enderecamentoPesarSegmentos({
  destinatarioNome,
  destinatarioTratamento,
}: {
  destinatarioNome: string;
  destinatarioTratamento: Tratamento;
}): SegmentoMocao[] {
  return [
    { texto: `À Família ${contracaoTratamento(destinatarioTratamento)} `, negrito: false },
    { texto: destinatarioNome || "[falecido(a)]", negrito: true },
    { texto: ".", negrito: false },
  ];
}

// Frase de abertura da Moção de Pesar — reproduz a redação de uma Moção
// de Pesar real já emitida pela Câmara (Antônio Antunes Almeida,
// 11/05/2026): "por meio da vereadora X, em associação dos vereadores Y,
// Z..., manifesta profundo pesar pelo falecimento do Senhor W...".
export function aberturaPesarSegmentos({
  autorNome,
  autorGenero,
  associadosNomes,
  destinatarioNome,
  destinatarioTratamento,
}: {
  autorNome: string;
  autorGenero: GeneroVereador;
  associadosNomes: string[];
  destinatarioNome: string;
  destinatarioTratamento: Tratamento;
}): SegmentoMocao[] {
  const segmentos: SegmentoMocao[] = [
    { texto: `A Câmara Municipal de Nepomuceno, por meio ${contracaoAutor(autorGenero)} `, negrito: false },
    { texto: (autorNome || "[autor]").toUpperCase(), negrito: true },
  ];

  if (associadosNomes.length > 0) {
    segmentos.push({ texto: ", em associação dos vereadores ", negrito: false });
    segmentos.push({
      texto: listaComE(associadosNomes.map((n) => n.toUpperCase())),
      negrito: true,
    });
  }

  segmentos.push({
    texto: `, manifesta profundo pesar pelo falecimento ${contracaoTratamento(destinatarioTratamento)} `,
    negrito: false,
  });
  segmentos.push({ texto: destinatarioNome || "[falecido(a)]", negrito: true });
  segmentos.push({
    texto: ", registrando sua solidariedade e respeito neste momento de dor e despedida.",
    negrito: false,
  });

  return segmentos;
}

// Texto de pêsames fixo — sempre o mesmo em toda Moção de Pesar
// (confirmado com o usuário), só o cabeçalho/endereçamento/abertura
// muda conforme o falecido e os signatários.
export const PARAGRAFOS_PESAR_FIXOS: string[] = [
  "Sua partida deixa saudades e um sentimento de tristeza entre familiares, amigos e todos aqueles que tiveram a oportunidade de conviver com sua presença e trajetória. Neste momento difícil, unimo-nos em oração para que Deus conceda conforto, serenidade e força aos corações enlutados.",
  "Que as lembranças construídas ao longo da vida permaneçam como legado de carinho, dignidade e amor, servindo de consolo a todos que hoje sentem sua ausência.",
  "Recebam nossas mais sinceras condolências e o abraço fraterno desta Casa Legislativa, que se associa ao luto da família e deseja que a paz de Deus prevaleça sobre todos.",
];

export function fechoMocao(dataMocao: string): string {
  return `Nepomuceno, ${dataPorExtenso(dataMocao)}.`;
}
