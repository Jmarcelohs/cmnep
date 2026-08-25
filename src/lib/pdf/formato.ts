export function formatarData(data: string | null) {
  if (!data) return "—";
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function formatarMoeda(valor: number) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

// Data por extenso em português, ex.: "2026-07-06" → "06 de julho de 2026".
export function dataPorExtenso(dataISO: string | null) {
  if (!dataISO) return "—";
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return `${String(dia).padStart(2, "0")} de ${MESES[mes - 1]} de ${ano}`;
}

// Data por extenso em fórmula notarial/cabeçalho de processo, ex.:
// "2026-08-10" → "aos dez dias do mês de agosto de dois mil e vinte e
// seis" — usada em documentos de Licitações (capa do processo). Reaproveita
// numeroPorExtenso (abaixo) pro dia e o ano.
export function dataPorExtensoFormal(dataISO: string | null): string {
  if (!dataISO) return "—";
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  // Dia 1 usa a forma singular tradicional ("no primeiro dia"), não
  // "aos um dias" — os demais dias usam a forma plural ("aos dois dias").
  if (dia === 1) return `no primeiro dia do mês de ${MESES[mes - 1]} de ${numeroPorExtenso(ano)}`;
  return `aos ${numeroPorExtenso(dia)} dias do mês de ${MESES[mes - 1]} de ${numeroPorExtenso(ano)}`;
}

const UNIDADES = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const DEZ_A_DEZENOVE = [
  "dez", "onze", "doze", "treze", "quatorze", "quinze",
  "dezesseis", "dezessete", "dezoito", "dezenove",
];
const DEZENAS = [
  "", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa",
];
const CENTENAS = [
  "", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos",
  "seiscentos", "setecentos", "oitocentos", "novecentos",
];

// Extenso de 0 a 999.
function grupoPorExtenso(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";

  const centena = Math.floor(n / 100);
  const resto = n % 100;
  const partes: string[] = [];

  if (centena > 0) partes.push(CENTENAS[centena]);

  if (resto > 0) {
    if (resto < 10) {
      partes.push(UNIDADES[resto]);
    } else if (resto < 20) {
      partes.push(DEZ_A_DEZENOVE[resto - 10]);
    } else {
      const dezena = Math.floor(resto / 10);
      const unidade = resto % 10;
      partes.push(unidade > 0 ? `${DEZENAS[dezena]} e ${UNIDADES[unidade]}` : DEZENAS[dezena]);
    }
  }

  return partes.join(" e ");
}

// Extenso de 0 a 999.999.999, dividido em grupos de milhão/mil/resto,
// unidos por vírgula — exceto o último grupo quando é menor que 100, que
// usa "e" (regra tradicional do português: "mil e um", "mil, cento e um").
export function numeroPorExtenso(n: number): string {
  if (n === 0) return "zero";

  const milhoes = Math.floor(n / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;

  const grupos: string[] = [];
  if (milhoes > 0) {
    grupos.push(milhoes === 1 ? "um milhão" : `${numeroPorExtenso(milhoes)} milhões`);
  }
  if (milhares > 0) {
    grupos.push(milhares === 1 ? "mil" : `${numeroPorExtenso(milhares)} mil`);
  }

  if (grupos.length === 0) return grupoPorExtenso(resto);
  if (resto === 0) return grupos.join(", ");

  const conectivo = resto < 100 ? " e " : ", ";
  return grupos.join(", ") + conectivo + grupoPorExtenso(resto);
}

// Valor monetário por extenso em português, ex.: 2825.82 →
// "Dois mil, oitocentos e vinte e cinco reais e oitenta e dois centavos".
export function valorPorExtenso(valor: number): string {
  const reais = Math.floor(valor);
  const centavos = Math.round((valor - reais) * 100);
  const partes: string[] = [];

  if (reais > 0) {
    const ehMilhaoRedondo = reais >= 1_000_000 && reais % 1_000_000 === 0;
    const palavraReal = reais === 1 ? "real" : ehMilhaoRedondo ? "de reais" : "reais";
    partes.push(`${numeroPorExtenso(reais)} ${palavraReal}`);
  }

  if (centavos > 0) {
    const palavraCentavo = centavos === 1 ? "centavo" : "centavos";
    partes.push(`${numeroPorExtenso(centavos)} ${palavraCentavo}`);
  }

  const texto = partes.length > 0 ? partes.join(" e ") : "zero reais";
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
