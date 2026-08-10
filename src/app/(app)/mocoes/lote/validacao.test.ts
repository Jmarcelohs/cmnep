import { describe, expect, it } from "vitest";
import { validarLoteMocoes } from "./validacao";
import type { TipoMocao } from "@/lib/supabase/database.types";

function linha(overrides: Partial<Parameters<typeof validarLoteMocoes>[0]["linhas"][0]> = {}) {
  return {
    destinatario: "Fulano",
    destinatario_tratamento: null,
    justificativa: "motivo",
    ...overrides,
  };
}

describe("validarLoteMocoes", () => {
  it("exige tipo, data e autor", () => {
    expect(
      validarLoteMocoes({
        tipo: "" as TipoMocao,
        data_mocao: "",
        autor_vereador_id: "",
        linhas: [],
      }),
    ).toBe("Preencha o tipo, a data e o autor");
  });

  it("exige ao menos uma linha", () => {
    expect(
      validarLoteMocoes({
        tipo: "congratulacoes",
        data_mocao: "2026-01-01",
        autor_vereador_id: "id",
        linhas: [],
      }),
    ).toBe("Adicione ao menos um homenageado");
  });

  it("exige destinatário em cada linha", () => {
    expect(
      validarLoteMocoes({
        tipo: "congratulacoes",
        data_mocao: "2026-01-01",
        autor_vereador_id: "id",
        linhas: [linha({ destinatario: "" })],
      }),
    ).toBe("Linha 1: preencha o nome do homenageado");
  });

  it("pesar exige tratamento por linha", () => {
    expect(
      validarLoteMocoes({
        tipo: "pesar",
        data_mocao: "2026-01-01",
        autor_vereador_id: "id",
        linhas: [linha({ destinatario_tratamento: null })],
      }),
    ).toBe("Linha 1: selecione o tratamento");
  });

  it("congratulações exige justificativa por linha", () => {
    expect(
      validarLoteMocoes({
        tipo: "congratulacoes",
        data_mocao: "2026-01-01",
        autor_vereador_id: "id",
        linhas: [linha({ justificativa: "" })],
      }),
    ).toBe("Linha 1: preencha a justificativa");
  });

  it("pesar não exige justificativa", () => {
    expect(
      validarLoteMocoes({
        tipo: "pesar",
        data_mocao: "2026-01-01",
        autor_vereador_id: "id",
        linhas: [linha({ destinatario_tratamento: "Sr.", justificativa: "" })],
      }),
    ).toBeNull();
  });

  it("aponta a linha certa quando há mais de uma", () => {
    expect(
      validarLoteMocoes({
        tipo: "congratulacoes",
        data_mocao: "2026-01-01",
        autor_vereador_id: "id",
        linhas: [linha(), linha({ destinatario: "" })],
      }),
    ).toBe("Linha 2: preencha o nome do homenageado");
  });

  it("tudo certo retorna null", () => {
    expect(
      validarLoteMocoes({
        tipo: "congratulacoes",
        data_mocao: "2026-01-01",
        autor_vereador_id: "id",
        linhas: [linha()],
      }),
    ).toBeNull();
  });
});
