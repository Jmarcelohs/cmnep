// Brasil não observa horário de verão desde 2019 — America/Sao_Paulo é
// sempre UTC-3, por isso dá pra montar o offset direto sem depender de
// Intl/timeZone database pra isso (ao contrário de hojeBrasil()/
// agoraBrasilFormatado() em src/lib/data-brasil.ts, que precisam do Intl
// porque lidam com "agora").
const OFFSET_BRASIL = "-03:00";

function mesAnoValido(mesAno: string): [number, number] {
  const [anoStr, mesStr] = mesAno.split("-");
  const ano = Number(anoStr);
  const mes = Number(mesStr);
  if (!ano || !mes || mes < 1 || mes > 12) {
    throw new Error(`mesAno inválido: "${mesAno}" (esperado "YYYY-MM")`);
  }
  return [ano, mes];
}

function formatarMesAno(ano: number, mes: number): string {
  return `${String(ano).padStart(4, "0")}-${String(mes).padStart(2, "0")}`;
}

// Início do mês (inclusive) e início do mês seguinte (exclusive) — mesma
// convenção de range [inicio, fim) já usada nos filtros de ano de
// Diárias/Reembolsos, em RFC3339 pra usar direto como timeMin/timeMax da
// API do Google Calendar.
export function limitesDoMes(mesAno: string): { inicio: string; fim: string } {
  const [ano, mes] = mesAnoValido(mesAno);
  const proximoMes = mes === 12 ? 1 : mes + 1;
  const anoDoProximoMes = mes === 12 ? ano + 1 : ano;

  return {
    inicio: `${formatarMesAno(ano, mes)}-01T00:00:00${OFFSET_BRASIL}`,
    fim: `${formatarMesAno(anoDoProximoMes, proximoMes)}-01T00:00:00${OFFSET_BRASIL}`,
  };
}

export function mesAtualBrasil(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  })
    .format(new Date())
    .replace("/", "-");
}

export function mesAdjacente(mesAno: string, delta: 1 | -1): string {
  const [ano, mes] = mesAnoValido(mesAno);
  const total = ano * 12 + (mes - 1) + delta;
  return formatarMesAno(Math.floor(total / 12), (total % 12) + 1);
}

const NOMES_MES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function nomeMesAno(mesAno: string): string {
  const [ano, mes] = mesAnoValido(mesAno);
  return `${NOMES_MES[mes - 1]} de ${ano}`;
}
