import { describe, expect, it } from "vitest";
import { dataPorExtenso, dataPorExtensoFormal, formatarData, formatarMoeda, valorPorExtenso } from "./formato";

describe("formatarData", () => {
  it("formata uma data ISO como dd/mm/aaaa", () => {
    expect(formatarData("2026-07-06")).toBe("06/07/2026");
  });

  it("retorna travessão quando a data é nula", () => {
    expect(formatarData(null)).toBe("—");
  });
});

describe("dataPorExtenso", () => {
  it("formata uma data ISO por extenso", () => {
    expect(dataPorExtenso("2026-07-06")).toBe("06 de julho de 2026");
  });

  it("cobre o mês de janeiro (índice 0) e dezembro (índice 11)", () => {
    expect(dataPorExtenso("2026-01-01")).toBe("01 de janeiro de 2026");
    expect(dataPorExtenso("2026-12-31")).toBe("31 de dezembro de 2026");
  });

  it("retorna travessão quando a data é nula", () => {
    expect(dataPorExtenso(null)).toBe("—");
  });
});

describe("dataPorExtensoFormal", () => {
  it("escreve dia e ano por extenso, formato de abertura de processo", () => {
    expect(dataPorExtensoFormal("2026-08-10")).toBe(
      "aos dez dias do mês de agosto de dois mil e vinte e seis",
    );
  });

  it("usa a forma singular tradicional pro dia 1 ('no primeiro dia')", () => {
    expect(dataPorExtensoFormal("2026-03-01")).toBe(
      "no primeiro dia do mês de março de dois mil e vinte e seis",
    );
  });

  it("retorna travessão quando a data é nula", () => {
    expect(dataPorExtensoFormal(null)).toBe("—");
  });
});

// toLocaleString("pt-BR", {style:"currency"}) insere um espaço NÃO separável
// (U+00A0, " ") entre "R$" e o valor, não um espaço comum — por isso
// os literais abaixo usam   em vez de " ".
describe("formatarMoeda", () => {
  it("formata valores em reais com separador de milhar e vírgula decimal", () => {
    expect(formatarMoeda(1000)).toBe("R$ 1.000,00");
    expect(formatarMoeda(1234567.89)).toBe("R$ 1.234.567,89");
  });

  it("formata zero", () => {
    expect(formatarMoeda(0)).toBe("R$ 0,00");
  });

  it("formata valores negativos", () => {
    expect(formatarMoeda(-50.5)).toBe("-R$ 50,50");
  });
});

describe("valorPorExtenso", () => {
  it("escreve zero", () => {
    expect(valorPorExtenso(0)).toBe("Zero reais");
  });

  it("usa singular pra um real e um centavo", () => {
    expect(valorPorExtenso(1)).toBe("Um real");
    expect(valorPorExtenso(0.01)).toBe("Um centavo");
  });

  it("trata cem como caso especial (não 'cento')", () => {
    expect(valorPorExtenso(100)).toBe("Cem reais");
  });

  it("usa 'de reais' pra milhão redondo, mas 'reais' quando não é redondo", () => {
    expect(valorPorExtenso(1_000_000)).toBe("Um milhão de reais");
    expect(valorPorExtenso(1_000_001)).toBe("Um milhão e um reais");
  });

  it("usa 'e' antes do último grupo quando < 100, vírgula quando >= 100", () => {
    expect(valorPorExtenso(1021)).toBe("Mil e vinte e um reais");
    expect(valorPorExtenso(2825.82)).toBe(
      "Dois mil, oitocentos e vinte e cinco reais e oitenta e dois centavos",
    );
  });

  it("combina reais e centavos, e omite a parte zerada", () => {
    expect(valorPorExtenso(1.5)).toBe("Um real e cinquenta centavos");
    expect(valorPorExtenso(0.5)).toBe("Cinquenta centavos");
    expect(valorPorExtenso(21)).toBe("Vinte e um reais");
  });

  it("encadeia centena, dezena e unidade num grupo só (cento e vinte e um)", () => {
    expect(valorPorExtenso(121)).toBe("Cento e vinte e um reais");
  });

  it("lida com valores grandes até a casa das centenas de milhar", () => {
    expect(valorPorExtenso(999999.99)).toBe(
      "Novecentos e noventa e nove mil, novecentos e noventa e nove reais e noventa e nove centavos",
    );
  });
});
