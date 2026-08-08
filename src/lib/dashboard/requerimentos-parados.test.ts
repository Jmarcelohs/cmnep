import { describe, expect, it } from "vitest";
import { estaParado } from "./requerimentos-parados";

describe("estaParado", () => {
  it("não está parado sem data de requerimento", () => {
    expect(estaParado(null, "2026-01-12", "pendente")).toBe(false);
  });

  it("não está parado quando já foi deferido", () => {
    // 2026-01-05 (segunda) até 2026-01-13 (terça): 6 dias úteis, mas já decidido.
    expect(estaParado("2026-01-05", "2026-01-13", "deferido")).toBe(false);
  });

  it("não está parado quando já foi indeferido", () => {
    expect(estaParado("2026-01-05", "2026-01-13", "indeferido")).toBe(false);
  });

  it("não está parado com menos de 5 dias úteis pendente", () => {
    // 2026-01-05 (segunda) até 2026-01-09 (sexta): 4 dias úteis.
    expect(estaParado("2026-01-05", "2026-01-09", "pendente")).toBe(false);
  });

  it("está parado com exatamente 5 dias úteis pendente", () => {
    // 2026-01-05 (segunda) até 2026-01-12 (segunda seguinte): 5 dias úteis.
    expect(estaParado("2026-01-05", "2026-01-12", "pendente")).toBe(true);
  });

  it("está parado com 5+ dias úteis em análise", () => {
    expect(estaParado("2026-01-05", "2026-01-12", "analise")).toBe(true);
  });
});
