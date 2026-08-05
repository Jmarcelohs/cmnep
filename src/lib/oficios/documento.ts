import { dataPorExtenso } from "@/lib/pdf/formato";
import { PRESIDENTE_PADRAO } from "@/lib/reembolso/documento";
import type { GeneroVereador, TipoOficio } from "@/lib/supabase/database.types";

export const NOME_CAMARA = "Câmara Municipal de Nepomuceno";
export const CIDADE = "Nepomuceno";
export const PRESIDENTE_CARGO = "Presidente da Câmara Municipal de Nepomuceno";
export const LEGISLATURA = "Legislatura 2025/2028";

// Ofícios saem sempre assinados pelo Presidente em exercício, independente
// de quem é citado como autor/proponente no corpo do texto — mesmo padrão
// já usado no requerimento de reembolso (ver src/lib/reembolso/documento.ts).
export const SIGNATARIO_OFICIO = PRESIDENTE_PADRAO;

export const TIPO_OFICIO_LABEL: Record<TipoOficio, string> = {
  padrao: "Ofício Padrão",
  indicacao: "Indicação",
  requerimento: "Requerimento",
  convite: "Convite",
};

// Nem todo tipo exige um autor/proponente nomeado no corpo — convite é
// sempre institucional (fala em nome da Presidência); indicação e
// requerimento sempre citam um vereador; padrão pode ou não ("por
// iniciativa do Vereador X" é opcional nesse tipo).
export const TIPO_EXIGE_AUTOR: Record<TipoOficio, boolean> = {
  padrao: false,
  indicacao: true,
  requerimento: true,
  convite: false,
};

// Só requerimento admite um segundo proponente associado, pelo modelo real
// usado pela Câmara ("com associação do Vereador Y").
export const TIPO_ADMITE_AUTOR_ASSOCIADO: Record<TipoOficio, boolean> = {
  padrao: false,
  indicacao: false,
  requerimento: true,
  convite: false,
};

export const PARAGRAFO_FECHAMENTO_PADRAO =
  "Certo de contar com a atenção e sensibilidade de Vossa Excelência, renovo votos de elevada estima e consideração.";

export function numeroOficioFormatado({ numero, ano }: { numero: string; ano: number }) {
  return `OFÍCIO Nº ${numero}/${ano}/SEC/CMN`;
}

function artigoGenero(genero: GeneroVereador) {
  return genero === "Vereadora" ? "a" : "o";
}

// Frase de abertura específica de cada tipo, que emenda direto no início do
// texto livre (corpo_texto) — reproduz literalmente a redação dos ofícios
// reais da Câmara (ex.: ofícios 251, 420, 455 e 482/2026), trocando só o
// que varia (nome do autor, gênero gramatical).
export function aberturaOficio({
  tipo,
  autorNome,
  autorGenero,
  autorAssociadoNome,
  autorAssociadoGenero,
}: {
  tipo: TipoOficio;
  autorNome?: string | null;
  autorGenero?: GeneroVereador | null;
  autorAssociadoNome?: string | null;
  autorAssociadoGenero?: GeneroVereador | null;
}): string {
  const genero = autorGenero ?? "Vereador";
  const generoAssociado = autorAssociadoGenero ?? "Vereador";

  switch (tipo) {
    case "requerimento": {
      const nome = autorNome || "[autor]";
      const clausulaAssociado = autorAssociadoNome
        ? `, com associação d${artigoGenero(generoAssociado)} ${generoAssociado} ${autorAssociadoNome},`
        : ",";
      return (
        `Comunico que ${artigoGenero(genero)} ${genero} ${nome}${clausulaAssociado} no uso de suas ` +
        `atribuições legais e regimentais, apresenta o presente REQUERIMENTO, com fundamento no artigo ` +
        `113 do Regimento Interno, para que `
      );
    }
    case "indicacao": {
      const nome = autorNome || "[autor]";
      return (
        `Por meio da presente INDICAÇÃO, ${artigoGenero(genero)} ${genero} ${nome}, no uso de suas ` +
        `atribuições legais e regimentais, indica que `
      );
    }
    case "convite":
      return `Por meio do presente, tenho a honra de convidar Vossa Excelência para participar `;
    case "padrao":
    default:
      if (autorNome) {
        return (
          `A ${NOME_CAMARA}, por iniciativa d${artigoGenero(genero)} ${genero.toLowerCase()} ${autorNome}, ` +
          `vem, respeitosamente, à presença de Vossa Excelência, por meio do presente, solicitar `
        );
      }
      return (
        `A ${NOME_CAMARA} vem, respeitosamente, à presença de Vossa Excelência, por meio do presente, ` +
        `solicitar `
      );
  }
}

// Sugestão de saudação a partir do cargo do destinatário — sempre editável
// pelo redator, porque a redação real varia mais do que dá pra prever
// (ex.: "Excelentíssimo Senhor Promotor," no ofício 251).
export function saudacaoSugerida(
  tratamento: "Excelentíssimo Senhor" | "Excelentíssima Senhora",
  cargo: string,
) {
  const feminino = tratamento === "Excelentíssima Senhora";
  if ((cargo || "").toLowerCase().includes("prefeit")) {
    return feminino ? "Senhora Prefeita," : "Senhor Prefeito,";
  }
  return feminino ? "Excelentíssima Senhora," : "Excelentíssimo Senhor,";
}

function escapeHtml(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Emenda a frase de abertura (texto simples, gerado automaticamente a
// partir de tipo/autor) direto no início do primeiro parágrafo do corpo em
// HTML vindo do editor de texto rico — mantém a leitura como uma frase só,
// igual aos ofícios reais da Câmara (ex.: "Comunico que o Vereador X...
// para que " + continuação escrita pelo redator, tudo num parágrafo). Se o
// corpo não começar com <p> (ex.: começa direto com uma lista), a abertura
// vira um parágrafo próprio antes do resto.
export function injetarAberturaHtml(abertura: string, corpoHtml: string): string {
  const aberturaEscapada = escapeHtml(abertura);
  const match = corpoHtml.match(/^<p[^>]*>/i);
  if (match) {
    return corpoHtml.slice(0, match[0].length) + aberturaEscapada + corpoHtml.slice(match[0].length);
  }
  return `<p>${aberturaEscapada}</p>${corpoHtml}`;
}

// Frase auto-gerada com data/hora/local do evento — só usada em convites,
// reproduz o segundo parágrafo do modelo real ("A referida audiência será
// realizada no dia ... às ... no Plenário...").
export function fraseEventoConvite({
  eventoData,
  eventoHora,
  eventoLocal,
}: {
  eventoData?: string | null;
  eventoHora?: string | null;
  eventoLocal?: string | null;
}): string | null {
  if (!eventoData && !eventoHora && !eventoLocal) return null;

  const quando = [
    eventoData ? `no dia ${dataPorExtenso(eventoData)}` : null,
    eventoHora ? `às ${eventoHora}` : null,
  ]
    .filter(Boolean)
    .join(", ");
  const onde = eventoLocal ? `, no ${eventoLocal}` : "";

  return `O evento será realizado${quando ? ` ${quando}` : ""}${onde}.`;
}
