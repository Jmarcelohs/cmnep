const FUSO_BRASIL = "America/Sao_Paulo";

// dataHoraISO vem da API do Google já com offset (ex.: "-03:00" pros
// eventos criados por este sistema) — normaliza pra hora de Brasília no
// display de qualquer forma, mesmo que um evento tenha sido criado direto
// no Google Agenda com outro fuso associado.
export function formatarHorario(dataHoraISO: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO_BRASIL,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dataHoraISO));
}

// diaISO: "YYYY-MM-DD" só, sem hora. Ancora ao meio-dia UTC antes de
// formatar — meia-noite UTC vira 21h do dia anterior em Brasília (UTC-3),
// o que mostraria a data errada; meio-dia UTC é sempre o mesmo dia
// civil em qualquer fuso do Brasil.
export function formatarDiaCompleto(diaISO: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO_BRASIL,
    day: "2-digit",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(new Date(`${diaISO}T12:00:00Z`));
}
