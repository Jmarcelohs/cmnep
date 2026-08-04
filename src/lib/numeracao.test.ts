import { describe, expect, it } from "vitest";
import { proximoNumero } from "./numeracao";

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
