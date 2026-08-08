import { describe, expect, it } from "vitest";
import { estaAtrasada } from "./diarias-atrasadas";

describe("estaAtrasada", () => {
  it("não está atrasada sem data de chegada", () => {
    expect(
      estaAtrasada({ dataChegada: null, hoje: "2026-01-12", temPrestacaoEnviada: false }),
    ).toBe(false);
  });

  it("não está atrasada quando a prestação já foi enviada", () => {
    // 2026-01-05 (segunda) até 2026-01-12 (segunda seguinte) são 5 dias úteis.
    expect(
      estaAtrasada({ dataChegada: "2026-01-05", hoje: "2026-01-12", temPrestacaoEnviada: true }),
    ).toBe(false);
  });

  it("não está atrasada com menos de 3 dias úteis desde o retorno", () => {
    // 2026-01-05 (segunda) até 2026-01-07 (quarta) são 2 dias úteis.
    expect(
      estaAtrasada({ dataChegada: "2026-01-05", hoje: "2026-01-07", temPrestacaoEnviada: false }),
    ).toBe(false);
  });

  it("está atrasada com exatamente 3 dias úteis desde o retorno", () => {
    // 2026-01-05 (segunda) até 2026-01-08 (quinta) são 3 dias úteis.
    expect(
      estaAtrasada({ dataChegada: "2026-01-05", hoje: "2026-01-08", temPrestacaoEnviada: false }),
    ).toBe(true);
  });

  it("pula fim de semana ao contar os dias úteis de atraso", () => {
    // 2026-01-02 (sexta) até 2026-01-06 (terça): sábado/domingo não contam,
    // só segunda e terça — 2 dias úteis, ainda não atrasada.
    expect(
      estaAtrasada({ dataChegada: "2026-01-02", hoje: "2026-01-06", temPrestacaoEnviada: false }),
    ).toBe(false);
  });
});
