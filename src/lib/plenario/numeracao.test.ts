import { describe, expect, it } from "vitest";
import { numerarSolicitacoes } from "./numeracao";
import type { SolicitacaoPlenario } from "./google-sheets";

function solicitacao(respostaTimestamp: string): SolicitacaoPlenario {
  return {
    respostaTimestamp,
    numeroRequerimento: "",
    nomeSolicitante: "Fulano",
    cpfCnpj: "",
    telefone: "",
    instituicao: "",
    finalidade: "",
    dataDesejada: "",
    horaInicio: "",
    horaFim: "",
    numeroParticipantes: "",
    tipoEvento: "",
    equipamentos: "",
    observacoes: "",
  };
}

describe("numerarSolicitacoes", () => {
  it("numera em ordem de submissão, não na ordem da lista de entrada", () => {
    const numeros = numerarSolicitacoes([
      solicitacao("2026-03-01T10:00:00"),
      solicitacao("2026-01-01T10:00:00"),
      solicitacao("2026-02-01T10:00:00"),
    ]);
    expect(numeros.get("2026-01-01T10:00:00")).toBe("001/2026");
    expect(numeros.get("2026-02-01T10:00:00")).toBe("002/2026");
    expect(numeros.get("2026-03-01T10:00:00")).toBe("003/2026");
  });

  it("reinicia a contagem a cada ano novo", () => {
    const numeros = numerarSolicitacoes([
      solicitacao("2025-12-30T10:00:00"),
      solicitacao("2026-01-05T10:00:00"),
      solicitacao("2026-01-06T10:00:00"),
    ]);
    expect(numeros.get("2025-12-30T10:00:00")).toBe("001/2025");
    expect(numeros.get("2026-01-05T10:00:00")).toBe("001/2026");
    expect(numeros.get("2026-01-06T10:00:00")).toBe("002/2026");
  });

  it("lista vazia não quebra", () => {
    expect(numerarSolicitacoes([]).size).toBe(0);
  });
});
