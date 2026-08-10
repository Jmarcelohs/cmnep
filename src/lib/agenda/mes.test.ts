import { afterEach, describe, expect, it, vi } from "vitest";
import { limitesDoMes, mesAtualBrasil, mesAdjacente, nomeMesAno } from "./mes";

describe("limitesDoMes", () => {
  it("calcula início do mês e início do mês seguinte, em -03:00", () => {
    expect(limitesDoMes("2026-08")).toEqual({
      inicio: "2026-08-01T00:00:00-03:00",
      fim: "2026-09-01T00:00:00-03:00",
    });
  });

  it("vira o ano corretamente em dezembro", () => {
    expect(limitesDoMes("2026-12")).toEqual({
      inicio: "2026-12-01T00:00:00-03:00",
      fim: "2027-01-01T00:00:00-03:00",
    });
  });

  it("rejeita mesAno em formato inválido", () => {
    expect(() => limitesDoMes("agosto/2026")).toThrow();
    expect(() => limitesDoMes("2026-13")).toThrow();
  });
});

describe("mesAtualBrasil", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("usa o mês de Brasília, não o mês UTC, à noite do último dia", () => {
    // 21h de 31/08/2026 em Brasília é 00h de 01/09/2026 em UTC.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:30:00Z"));
    expect(mesAtualBrasil()).toBe("2026-08");
  });
});

describe("mesAdjacente", () => {
  it("avança um mês", () => {
    expect(mesAdjacente("2026-08", 1)).toBe("2026-09");
  });

  it("volta um mês", () => {
    expect(mesAdjacente("2026-08", -1)).toBe("2026-07");
  });

  it("avança virando o ano", () => {
    expect(mesAdjacente("2026-12", 1)).toBe("2027-01");
  });

  it("volta virando o ano", () => {
    expect(mesAdjacente("2026-01", -1)).toBe("2025-12");
  });
});

describe("nomeMesAno", () => {
  it("formata por extenso em português", () => {
    expect(nomeMesAno("2026-08")).toBe("agosto de 2026");
  });
});
