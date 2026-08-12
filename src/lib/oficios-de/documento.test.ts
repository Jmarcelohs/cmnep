import { describe, expect, it } from "vitest";
import { abreviarTratamento, numeroOficioDEFormatado, saudacaoSugeridaDE } from "./documento";

describe("numeroOficioDEFormatado", () => {
  it("formata número e ano no padrão DE/CMN", () => {
    expect(numeroOficioDEFormatado({ numero: "014", ano: 2026 })).toBe("OFÍCIO Nº 014/2026/DE/CMN");
  });
});

describe("abreviarTratamento", () => {
  it("abrevia os 4 tratamentos possíveis", () => {
    expect(abreviarTratamento("Excelentíssimo Senhor")).toBe("Exmo. Sr.");
    expect(abreviarTratamento("Excelentíssima Senhora")).toBe("Exma. Sra.");
    expect(abreviarTratamento("Ilustríssimo Senhor")).toBe("Ilmo. Sr.");
    expect(abreviarTratamento("Ilustríssima Senhora")).toBe("Ilma. Sra.");
  });
});

describe("saudacaoSugeridaDE", () => {
  it("usa a primeira palavra do cargo com o título masculino", () => {
    expect(saudacaoSugeridaDE("Ilustríssimo Senhor", "Controlador Geral do Município")).toBe(
      "Senhor Controlador,",
    );
  });

  it("usa o título feminino quando o tratamento é feminino", () => {
    expect(saudacaoSugeridaDE("Ilustríssima Senhora", "Secretária Municipal de Saúde")).toBe(
      "Senhora Secretária,",
    );
  });

  it("cai no título genérico quando o cargo está vazio", () => {
    expect(saudacaoSugeridaDE("Excelentíssimo Senhor", "")).toBe("Senhor,");
  });
});
