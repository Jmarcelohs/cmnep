import { describe, expect, it } from "vitest";
import { numeroRomano, segmentosFicha, valorPorExtensoMinusculo } from "./documento";
import type { DotacaoOrcamentaria } from "./documento";

const FICHA_22: DotacaoOrcamentaria = {
  id: "id-22",
  ficha: 22,
  orgao_codigo: "01",
  orgao_nome: "Legislativo Municipal",
  unidade_codigo: "01",
  unidade_nome: "Gabinete e Secretaria da Câmara",
  subfuncao_codigo: "031",
  subfuncao_nome: "Ação Legislativa",
  programa_codigo: "0001",
  programa_nome: "Atividades Legislativas",
  projeto_atividade_codigo: "2001",
  projeto_atividade_nome: "Manutenção das Atividades do Legislativo Municipal",
  elemento_codigo: "339039",
  elemento_nome: "Outros Serviços de Terceiros - Pessoa Jurídica",
  fonte_codigo: "1500",
  fonte_nome: "Recursos Ordinários",
  saldo_referencia: 4601.86,
  saldo_referencia_em: "2026-08-12",
  ativo: true,
  criado_em: "2026-08-12T00:00:00Z",
};

describe("numeroRomano", () => {
  it("converte números pequenos (uso real: itens de um artigo)", () => {
    expect(numeroRomano(1)).toBe("I");
    expect(numeroRomano(2)).toBe("II");
    expect(numeroRomano(3)).toBe("III");
    expect(numeroRomano(4)).toBe("IV");
    expect(numeroRomano(5)).toBe("V");
    expect(numeroRomano(9)).toBe("IX");
    expect(numeroRomano(10)).toBe("X");
  });
});

describe("segmentosFicha", () => {
  it("monta os 7 códigos acumulados na mesma ordem de um Ato real", () => {
    const segmentos = segmentosFicha(FICHA_22);
    expect(segmentos.map((s) => s.codigo)).toEqual([
      "01",
      "01.01",
      "01.01.031",
      "01.01.031.0001",
      "01.01.031.0001.2001",
      "01.01.031.0001.2001.339039",
      "01.01.031.0001.2001.339039.1500",
    ]);
    expect(segmentos[segmentos.length - 1].nome).toBe("Recursos Ordinários");
  });
});

describe("valorPorExtensoMinusculo", () => {
  it("começa com minúscula (encaixa depois de 'no valor total de R$X (...)')", () => {
    expect(valorPorExtensoMinusculo(53000)).toBe("cinquenta e três mil reais");
  });
});
