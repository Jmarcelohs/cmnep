import { describe, expect, it } from "vitest";
import {
  consolidarPorDotacao,
  contarAniversariosReajuste,
  gerarAlertas,
  provisionamentoMensalContrato,
  totalAnualContrato,
  valorMensalContrato,
} from "./calculo";
import type { Contrato } from "./tipos";

function contrato(sobrescreve: Partial<Contrato> = {}): Contrato {
  return {
    id: "c1",
    nome: "Contrato de teste",
    fornecedor: "Fornecedor Ltda",
    valorVigente: 10000,
    tipoValor: "mensal",
    dataInicioVigencia: "2026-01-01",
    dataFimVigencia: "2028-12-31",
    dataProximoReajuste: "2027-06-01",
    indiceCorrecao: "IPCA",
    percentualEstimado: 0.05,
    situacao: "continua",
    valorNovoContratoEstimado: null,
    dataInicioNovoContrato: null,
    fichaOrcamentaria: "50",
    dotacao: "01.01.031.0001.2001.339039.1500",
    elementoDespesa: "339039",
    observacoes: "",
    criadoEm: "2026-08-20T00:00:00.000Z",
    ...sobrescreve,
  };
}

describe("contarAniversariosReajuste", () => {
  it("devolve 0 antes da data de reajuste", () => {
    expect(contarAniversariosReajuste("2027-06-01", 2027, 5)).toBe(0);
  });

  it("devolve 1 no mês do reajuste e nos meses seguintes do mesmo ciclo anual", () => {
    expect(contarAniversariosReajuste("2027-06-01", 2027, 6)).toBe(1);
    expect(contarAniversariosReajuste("2027-06-01", 2027, 12)).toBe(1);
  });

  it("conta aniversários intermediários quando a âncora já está no passado", () => {
    // âncora em jun/2025 — até dez/2027 já passaram os aniversários de 2025, 2026 e 2027
    expect(contarAniversariosReajuste("2025-06-01", 2027, 12)).toBe(3);
    // em jan/2027, só os de 2025 e 2026 já ocorreram (o de 2027 é em junho, ainda não chegou)
    expect(contarAniversariosReajuste("2025-06-01", 2027, 1)).toBe(2);
  });
});

describe("valorMensalContrato — exemplo do Memorial de Cálculo", () => {
  // "Contrato de R$ 10.000,00/mês, com reajuste de 5% previsto para
  // 01/06/2027: Jan–Mai R$ 10.000,00, Jun–Dez R$ 10.500,00."
  const c = contrato({
    dataInicioVigencia: "2020-01-01",
    dataFimVigencia: "2030-12-31",
    dataProximoReajuste: "2027-06-01",
    percentualEstimado: 0.05,
  });

  it("Jan a Mai/2027 fica no valor base", () => {
    for (const mes of [1, 2, 3, 4, 5]) {
      expect(valorMensalContrato(c, 2027, mes)).toBe(10000);
    }
  });

  it("Jun a Dez/2027 aplica o reajuste de 5%", () => {
    for (const mes of [6, 7, 8, 9, 10, 11, 12]) {
      expect(valorMensalContrato(c, 2027, mes)).toBeCloseTo(10500, 6);
    }
  });

  it("o total anual bate com a fórmula do exemplo (5×10.000 + 7×10.500)", () => {
    // O Memorial de Cálculo escreve essa mesma fórmula mas erra a conta
    // final (diz "R$ 102.500,00"; 5×10.000 + 7×10.500 = R$ 123.500,00) —
    // o teste segue a fórmula, que é o que o código implementa.
    expect(totalAnualContrato(c, 2027)).toBeCloseTo(5 * 10000 + 7 * 10500, 2);
  });
});

describe("valorMensalContrato — vigência", () => {
  it("é R$ 0 antes do início da vigência", () => {
    const c = contrato({ dataInicioVigencia: "2027-04-01" });
    expect(valorMensalContrato(c, 2027, 1)).toBe(0);
    expect(valorMensalContrato(c, 2027, 3)).toBe(0);
    expect(valorMensalContrato(c, 2027, 4)).toBeGreaterThan(0);
  });

  it("situação 'vence': zera a partir do mês seguinte ao fim da vigência", () => {
    const c = contrato({ situacao: "vence", dataFimVigencia: "2027-06-30" });
    expect(valorMensalContrato(c, 2027, 6)).toBeGreaterThan(0);
    expect(valorMensalContrato(c, 2027, 7)).toBe(0);
    expect(valorMensalContrato(c, 2027, 12)).toBe(0);
  });

  it("situação 'continua': ignora o fim da vigência e segue calculando", () => {
    const c = contrato({ situacao: "continua", dataFimVigencia: "2027-03-31" });
    expect(valorMensalContrato(c, 2027, 12)).toBeGreaterThan(0);
  });

  it("situação 'nova_licitacao' sem valor estimado ainda: zera igual 'vence'", () => {
    const c = contrato({ situacao: "nova_licitacao", dataFimVigencia: "2027-06-30" });
    expect(valorMensalContrato(c, 2027, 7)).toBe(0);
  });

  it("situação 'nova_licitacao' com valor estimado: substitui a partir do mês indicado", () => {
    const c = contrato({
      situacao: "nova_licitacao",
      dataFimVigencia: "2027-06-30",
      valorNovoContratoEstimado: 15000,
      dataInicioNovoContrato: "2027-09-01",
    });
    expect(valorMensalContrato(c, 2027, 7)).toBe(0); // ainda não chegou a data do novo contrato
    expect(valorMensalContrato(c, 2027, 8)).toBe(0);
    expect(valorMensalContrato(c, 2027, 9)).toBe(15000);
    expect(valorMensalContrato(c, 2027, 12)).toBe(15000);
  });
});

describe("valorMensalContrato — conversão de valor anual pra mensal", () => {
  it("divide por 12 quando tipoValor é 'anual'", () => {
    const c = contrato({ tipoValor: "anual", valorVigente: 120000, percentualEstimado: 0 });
    expect(valorMensalContrato(c, 2027, 1)).toBe(10000);
  });
});

describe("provisionamentoMensalContrato", () => {
  it("devolve 12 valores, um por mês", () => {
    const c = contrato();
    expect(provisionamentoMensalContrato(c, 2027)).toHaveLength(12);
  });
});

describe("consolidarPorDotacao", () => {
  it("agrupa por ficha orçamentária quando preenchida", () => {
    const a = contrato({ id: "a", fichaOrcamentaria: "50", percentualEstimado: 0 });
    const b = contrato({ id: "b", fichaOrcamentaria: "50", percentualEstimado: 0 });
    const c = contrato({ id: "c", fichaOrcamentaria: "60", percentualEstimado: 0 });
    const grupos = consolidarPorDotacao([a, b, c], 2027);
    expect(grupos.map((g) => g.chave)).toEqual(["50", "60"]);
    expect(grupos[0].contratos).toHaveLength(2);
    expect(grupos[0].totalAnual).toBeCloseTo(240000, 2); // 2 contratos × 10.000 × 12
  });

  it("cai pra dotação quando a ficha está vazia", () => {
    const a = contrato({ fichaOrcamentaria: "", dotacao: "01.01.031" });
    const grupos = consolidarPorDotacao([a], 2027);
    expect(grupos[0].chave).toBe("01.01.031");
  });

  it("usa um rótulo padrão quando ficha e dotação estão vazias", () => {
    const a = contrato({ fichaOrcamentaria: "", dotacao: "" });
    const grupos = consolidarPorDotacao([a], 2027);
    expect(grupos[0].chave).toBe("(sem ficha/dotação)");
  });
});

describe("gerarAlertas", () => {
  it("alerta contratos 'vence' cuja vigência termina no ano de referência", () => {
    const c = contrato({ situacao: "vence", dataFimVigencia: "2027-06-30" });
    const alertas = gerarAlertas([c], 2027);
    expect(alertas).toHaveLength(1);
    expect(alertas[0].tipo).toBe("sem_renovacao");
  });

  it("não alerta contrato 'vence' cuja vigência termina fora do ano de referência", () => {
    const c = contrato({ situacao: "vence", dataFimVigencia: "2029-06-30" });
    expect(gerarAlertas([c], 2027)).toHaveLength(0);
  });

  it("não alerta contratos 'continua'", () => {
    const c = contrato({ situacao: "continua", dataFimVigencia: "2027-06-30" });
    expect(gerarAlertas([c], 2027)).toHaveLength(0);
  });

  it("sempre alerta contratos 'nova_licitacao' (lembrete), mesmo sem valor estimado ainda", () => {
    const c = contrato({ situacao: "nova_licitacao", dataFimVigencia: "2027-06-30" });
    const alertas = gerarAlertas([c], 2027);
    expect(alertas).toHaveLength(1);
    expect(alertas[0].tipo).toBe("nova_licitacao");
  });
});
