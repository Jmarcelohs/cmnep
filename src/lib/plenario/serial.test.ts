import { describe, expect, it } from "vitest";
import { serialParaData, serialParaHora } from "./serial";

describe("serialParaData", () => {
  it("converte o epoch Unix (serial 25569, constante conhecida) pra 1970-01-01", () => {
    expect(serialParaData(25569)).toBe("1970-01-01");
  });

  it("converte uma data recente", () => {
    // 2026-08-10 = 25569 + (dias entre 1970-01-01 e 2026-08-10)
    const dias = Math.round((Date.UTC(2026, 7, 10) - Date.UTC(1970, 0, 1)) / 86400000);
    expect(serialParaData(25569 + dias)).toBe("2026-08-10");
  });

  it("ignora a parte fracionária (hora) ao extrair a data", () => {
    expect(serialParaData(25569.5)).toBe("1970-01-01");
  });
});

describe("serialParaHora", () => {
  it("converte meio-dia (fração 0.5) pra 12:00:00", () => {
    expect(serialParaHora(0.5)).toBe("12:00:00");
  });

  it("converte 14:30:00 (fração 14.5/24)", () => {
    expect(serialParaHora(14.5 / 24)).toBe("14:30:00");
  });

  it("ignora a parte inteira (data) ao extrair a hora", () => {
    expect(serialParaHora(45870.5)).toBe("12:00:00");
  });

  it("converte meia-noite (fração 0)", () => {
    expect(serialParaHora(45870)).toBe("00:00:00");
  });
});
