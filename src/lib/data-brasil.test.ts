import { afterEach, describe, expect, it, vi } from "vitest";
import { hojeBrasil, agoraBrasilFormatado } from "./data-brasil";

describe("hojeBrasil", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("usa a data de Brasília, não a data UTC, à noite", () => {
    // 21h de 08/08/2026 em Brasília (UTC-3) é 00h de 09/08/2026 em UTC —
    // toISOString().slice(0, 10) erraria pro dia seguinte aqui.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T00:30:00Z"));
    expect(hojeBrasil()).toBe("2026-08-08");
  });

  it("bate com a data UTC de manhã (sem diferença de dia)", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T15:00:00Z"));
    expect(hojeBrasil()).toBe("2026-08-09");
  });
});

describe("agoraBrasilFormatado", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("mostra a hora de Brasília (UTC-3), não a hora UTC", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-09T15:00:00Z"));
    expect(agoraBrasilFormatado()).toContain("12:00:00");
  });
});
