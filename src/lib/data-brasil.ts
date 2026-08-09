const FUSO_BRASIL = "America/Sao_Paulo";

// O runtime do servidor (Vercel) roda em UTC — sem fuso horário explícito,
// `new Date().toISOString().slice(0, 10)` mostra a data errada boa parte
// da noite (ex.: 21h em Brasília já é 00h do dia seguinte em UTC), e
// `toLocaleString()` sem timeZone mostra hora UTC como se fosse local.
// Essas funções sempre calculam em horário de Brasília, independente do
// fuso do processo do servidor.

export function hojeBrasil(): string {
  // en-CA formata como YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO_BRASIL }).format(new Date());
}

export function agoraBrasilFormatado(): string {
  return new Date().toLocaleString("pt-BR", { timeZone: FUSO_BRASIL });
}
