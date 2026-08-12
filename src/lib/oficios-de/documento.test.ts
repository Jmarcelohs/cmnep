import { describe, expect, it } from "vitest";
import { numeroOficioDEFormatado, saudacaoSugeridaDE } from "./documento";

describe("numeroOficioDEFormatado", () => {
  it("formata número e ano no padrão DE/CMN", () => {
    expect(numeroOficioDEFormatado({ numero: "014", ano: 2026 })).toBe("OFÍCIO Nº 014/2026/DE/CMN");
  });
});

describe("saudacaoSugeridaDE", () => {
  it("usa a primeira palavra do cargo com o título masculino", () => {
    expect(saudacaoSugeridaDE("Ilmo. Sr.", "Controlador Geral do Município")).toBe(
      "Senhor Controlador,",
    );
  });

  it("usa o título feminino quando o tratamento termina em 'Sra.'", () => {
    expect(saudacaoSugeridaDE("Ilma. Sra.", "Secretária Municipal de Saúde")).toBe(
      "Senhora Secretária,",
    );
  });

  it("cai no título genérico quando o cargo está vazio", () => {
    expect(saudacaoSugeridaDE("Exmo. Sr.", "")).toBe("Senhor,");
  });

  it("cai no título masculino quando o tratamento está vazio (endereçado a um setor)", () => {
    expect(saudacaoSugeridaDE("", "Departamento de Arrecadação")).toBe("Senhor Departamento,");
  });
});
