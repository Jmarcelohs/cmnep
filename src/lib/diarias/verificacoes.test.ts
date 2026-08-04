import { describe, expect, it } from "vitest";
import { calcularVerificacoes, diasUteisEntre } from "./verificacoes";

describe("diasUteisEntre", () => {
  it("conta dias úteis entre início (exclusive) e fim (inclusive), sem fim de semana", () => {
    // 2026-01-05 é segunda-feira, 2026-01-09 é sexta — sem fim de semana no meio.
    expect(diasUteisEntre("2026-01-05", "2026-01-09")).toBe(4);
  });

  it("pula o fim de semana no meio do intervalo", () => {
    // 2026-01-02 (sexta) até 2026-01-06 (terça): sábado e domingo não contam.
    expect(diasUteisEntre("2026-01-02", "2026-01-06")).toBe(2);
  });

  it("retorna 0 quando início e fim são o mesmo dia", () => {
    expect(diasUteisEntre("2026-01-05", "2026-01-05")).toBe(0);
  });
});

describe("calcularVerificacoes", () => {
  const base = {
    dataSolicitacao: "2026-01-05",
    dataPartida: "2026-01-09",
    faixasItens: ["Belo Horizonte"],
    temPendenciaAnterior: false,
  };

  it("marca prazo como indisponível quando falta data de solicitação ou partida", () => {
    const verificacoes = calcularVerificacoes({ ...base, dataSolicitacao: null });
    const prazo = verificacoes.find((v) => v.titulo.startsWith("Prazo"));
    expect(prazo?.status).toBe("indisponivel");
  });

  it("marca prazo como ok quando há 2+ dias úteis até a partida", () => {
    const verificacoes = calcularVerificacoes(base);
    const prazo = verificacoes.find((v) => v.titulo.startsWith("Prazo"));
    expect(prazo?.status).toBe("ok");
  });

  it("marca prazo como atenção quando há menos de 2 dias úteis", () => {
    const verificacoes = calcularVerificacoes({
      ...base,
      dataSolicitacao: "2026-01-08",
      dataPartida: "2026-01-09",
    });
    const prazo = verificacoes.find((v) => v.titulo.startsWith("Prazo"));
    expect(prazo?.status).toBe("atencao");
  });

  it("marca atenção quando algum item está na faixa 'Até 60 km'", () => {
    const verificacoes = calcularVerificacoes({ ...base, faixasItens: ["Até 60 km"] });
    const distancia = verificacoes.find((v) => v.titulo.startsWith("Distância"));
    expect(distancia?.status).toBe("atencao");
  });

  it("marca ok quando nenhum item está na faixa 'Até 60 km'", () => {
    const verificacoes = calcularVerificacoes(base);
    const distancia = verificacoes.find((v) => v.titulo.startsWith("Distância"));
    expect(distancia?.status).toBe("ok");
  });

  it("reflete pendência de prestação de contas anterior", () => {
    const verificacoes = calcularVerificacoes({ ...base, temPendenciaAnterior: true });
    const pendencia = verificacoes.find((v) => v.titulo.startsWith("Prestações"));
    expect(pendencia?.status).toBe("atencao");
  });

  it("dotação orçamentária é sempre indisponível (sem módulo de orçamento)", () => {
    const verificacoes = calcularVerificacoes(base);
    const dotacao = verificacoes.find((v) => v.titulo.startsWith("Dotação"));
    expect(dotacao?.status).toBe("indisponivel");
  });
});
