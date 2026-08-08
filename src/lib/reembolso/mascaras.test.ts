import { describe, expect, it } from "vitest";
import { apenasDigitos, formatarCpfDigitado, formatarValorDigitado } from "./mascaras";

describe("apenasDigitos", () => {
  it("remove tudo que não é dígito", () => {
    expect(apenasDigitos("123.456-78")).toBe("12345678");
    expect(apenasDigitos("(35) 99999-0000")).toBe("35999990000");
  });

  it("retorna vazio quando não há dígitos", () => {
    expect(apenasDigitos("abc")).toBe("");
    expect(apenasDigitos("")).toBe("");
  });
});

describe("formatarCpfDigitado", () => {
  it("retorna vazio sem dígitos", () => {
    expect(formatarCpfDigitado("")).toBe("");
  });

  it("não pontua enquanto não completa 3 dígitos", () => {
    expect(formatarCpfDigitado("12")).toBe("12");
  });

  it("adiciona o primeiro ponto a partir do 4º dígito", () => {
    expect(formatarCpfDigitado("123456")).toBe("123.456");
  });

  it("adiciona o segundo ponto a partir do 7º dígito", () => {
    expect(formatarCpfDigitado("123456789")).toBe("123.456.789");
  });

  it("adiciona o hífen a partir do 10º dígito (CPF completo)", () => {
    expect(formatarCpfDigitado("12345678901")).toBe("123.456.789-01");
  });

  it("ignora dígitos além do 11º", () => {
    expect(formatarCpfDigitado("123456789019999")).toBe("123.456.789-01");
  });

  it("ignora caracteres não numéricos digitados no meio", () => {
    expect(formatarCpfDigitado("123.456-789.01")).toBe("123.456.789-01");
  });
});

// toLocaleString("pt-BR", {style:"currency"}) insere um espaço NÃO
// separável (U+00A0) entre "R$" e o valor — por isso os literais abaixo
// usam   em vez de " ".
describe("formatarValorDigitado", () => {
  it("trata a entrada vazia como zero", () => {
    expect(formatarValorDigitado("")).toEqual({ texto: "R$ 0,00", valor: 0 });
  });

  it("trata o texto digitado como centavos (da direita pra esquerda)", () => {
    expect(formatarValorDigitado("5")).toEqual({ texto: "R$ 0,05", valor: 0.05 });
    expect(formatarValorDigitado("282582")).toEqual({ texto: "R$ 2.825,82", valor: 2825.82 });
  });

  it("ignora zeros à esquerda no valor numérico resultante", () => {
    expect(formatarValorDigitado("000500")).toEqual({ texto: "R$ 5,00", valor: 5 });
  });

  it("lida com valores grandes", () => {
    expect(formatarValorDigitado("99999999")).toEqual({ texto: "R$ 999.999,99", valor: 999999.99 });
  });
});
