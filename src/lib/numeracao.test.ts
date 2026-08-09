import { describe, expect, it } from "vitest";
import { proximoNumero, proximoNumeroSolicitacaoAno } from "./numeracao";

describe("proximoNumero", () => {
  it("retorna o maior número existente + 1", () => {
    expect(proximoNumero(["001", "002", "005"])).toBe(6);
  });

  it("ignora a ordem da lista — pega o maior, não o último", () => {
    expect(proximoNumero(["010", "003", "007"])).toBe(11);
  });

  it("usa o fallback quando a lista está vazia", () => {
    expect(proximoNumero([], 52)).toBe(52);
  });

  it("usa o fallback padrão 1 quando não informado", () => {
    expect(proximoNumero([])).toBe(1);
  });

  it("trata números inválidos/vazios como 0, sem quebrar", () => {
    expect(proximoNumero(["abc", "", "003"])).toBe(4);
  });

  it("aceita números tanto como string quanto como number", () => {
    expect(proximoNumero([1, "2", 3])).toBe(4);
  });
});

describe("proximoNumeroSolicitacaoAno", () => {
  it("primeira solicitação do ano começa em 001", () => {
    expect(proximoNumeroSolicitacaoAno([], 2026)).toBe("001/2026");
  });

  it("calcula o próximo com base só nas solicitações do ano pedido", () => {
    expect(proximoNumeroSolicitacaoAno(["001/2026", "002/2026", "003/2026"], 2026)).toBe(
      "004/2026",
    );
  });

  it("ignora solicitações de outros anos da mesma pessoa", () => {
    expect(proximoNumeroSolicitacaoAno(["018/2025", "019/2025"], 2026)).toBe("001/2026");
  });

  it("reinicia em 001 no ano novo mesmo com histórico de anos anteriores", () => {
    const historico = ["001/2025", "002/2025", "003/2025", "001/2026"];
    expect(proximoNumeroSolicitacaoAno(historico, 2026)).toBe("002/2026");
  });

  it("ignora valores nulos/vazios sem quebrar", () => {
    expect(proximoNumeroSolicitacaoAno([null, "", "005/2026"], 2026)).toBe("006/2026");
  });

  it("pega o maior número, não o último da lista", () => {
    expect(proximoNumeroSolicitacaoAno(["010/2026", "003/2026", "007/2026"], 2026)).toBe(
      "011/2026",
    );
  });
});
