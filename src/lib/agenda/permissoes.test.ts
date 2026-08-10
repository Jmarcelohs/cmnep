import { describe, expect, it } from "vitest";
import { podeExcluirEvento } from "./permissoes";

describe("podeExcluirEvento", () => {
  it("admin pode excluir evento de qualquer um", () => {
    const usuario = { id: "u1", papel: "admin" as const };
    expect(podeExcluirEvento(usuario, { criadoPorUsuarioId: "outro" })).toBe(true);
  });

  it("ordenador de despesa pode excluir evento de qualquer um", () => {
    const usuario = { id: "u1", papel: "ordenador_despesa" as const };
    expect(podeExcluirEvento(usuario, { criadoPorUsuarioId: "outro" })).toBe(true);
  });

  it("quem criou o evento pode excluir o próprio, mesmo sem papel elevado", () => {
    const usuario = { id: "u1", papel: "servidor" as const };
    expect(podeExcluirEvento(usuario, { criadoPorUsuarioId: "u1" })).toBe(true);
  });

  it("usuário comum não pode excluir evento de outra pessoa", () => {
    const usuario = { id: "u1", papel: "servidor" as const };
    expect(podeExcluirEvento(usuario, { criadoPorUsuarioId: "outro" })).toBe(false);
  });

  it("evento sem autoria registrada (criado fora do sistema) só admin/ordenador excluem", () => {
    const usuario = { id: "u1", papel: "estagiario" as const };
    expect(podeExcluirEvento(usuario, { criadoPorUsuarioId: null })).toBe(false);
  });
});
