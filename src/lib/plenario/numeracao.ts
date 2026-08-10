import type { SolicitacaoPlenario } from "./google-sheets";

// A planilha só tem "Número do Requerimento" preenchido manualmente em
// parte dos pedidos (a maioria ficou em branco depois que alguém parou
// de numerar à mão) — em vez de mostrar essa numeração esparsa, o
// sistema sempre recalcula um número sequencial próprio, por ano, na
// ordem de submissão (respostaTimestamp = "Carimbo de data/hora", ou
// seja, quando o pedido foi de fato enviado — não a data desejada de
// uso, que é outro campo). Nunca escrito de volta na planilha.
export function numerarSolicitacoes(
  solicitacoes: SolicitacaoPlenario[],
): Map<string, string> {
  const ordenadas = [...solicitacoes].sort((a, b) =>
    a.respostaTimestamp.localeCompare(b.respostaTimestamp),
  );

  const contadorPorAno = new Map<number, number>();
  const numeros = new Map<string, string>();

  for (const s of ordenadas) {
    const ano = Number(s.respostaTimestamp.slice(0, 4));
    const proximo = (contadorPorAno.get(ano) ?? 0) + 1;
    contadorPorAno.set(ano, proximo);
    numeros.set(s.respostaTimestamp, `${String(proximo).padStart(3, "0")}/${ano}`);
  }

  return numeros;
}
