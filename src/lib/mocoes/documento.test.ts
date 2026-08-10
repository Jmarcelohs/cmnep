import { describe, expect, it } from "vitest";
import { corpoAberturaMocao, fechoMocao, fraseApresentacaoMocao, tituloMocao } from "./documento";

describe("tituloMocao", () => {
  it("retorna o rótulo em maiúsculas", () => {
    expect(tituloMocao("louvor")).toBe("MOÇÃO DE LOUVOR");
    expect(tituloMocao("congratulacoes")).toBe("MOÇÃO DE CONGRATULAÇÕES");
    expect(tituloMocao("pesar")).toBe("MOÇÃO DE PESAR");
    expect(tituloMocao("repudio")).toBe("MOÇÃO DE REPÚDIO");
  });
});

describe("fraseApresentacaoMocao", () => {
  it("louvor: dirigida a alguém", () => {
    expect(fraseApresentacaoMocao({ tipo: "louvor", destinatario: "Maria Silva" })).toBe(
      "apresenta MOÇÃO DE LOUVOR a Maria Silva, pelos motivos a seguir expostos:",
    );
  });

  it("congratulações: dirigida a alguém", () => {
    expect(fraseApresentacaoMocao({ tipo: "congratulacoes", destinatario: "Maria Silva" })).toBe(
      "apresenta MOÇÃO DE CONGRATULAÇÕES a Maria Silva, pelos motivos a seguir expostos:",
    );
  });

  it("pesar: menciona o falecimento", () => {
    expect(fraseApresentacaoMocao({ tipo: "pesar", destinatario: "João Souza" })).toBe(
      "apresenta MOÇÃO DE PESAR pelo falecimento de João Souza, pelos motivos a seguir expostos:",
    );
  });

  it("repúdio: 'em relação a'", () => {
    expect(fraseApresentacaoMocao({ tipo: "repudio", destinatario: "medida X" })).toBe(
      "apresenta MOÇÃO DE REPÚDIO em relação a medida X, pelos motivos a seguir expostos:",
    );
  });

  it("sem destinatário cai no placeholder", () => {
    expect(fraseApresentacaoMocao({ tipo: "louvor", destinatario: "" })).toContain("a [destinatário],");
  });
});

describe("corpoAberturaMocao", () => {
  it("monta a abertura com autor e partido", () => {
    expect(
      corpoAberturaMocao({
        tipo: "louvor",
        destinatario: "campanha Y",
        autorNome: "Carlos",
        autorPartido: "PL",
      }),
    ).toBe(
      "A Câmara Municipal de Nepomuceno – MG, por intermédio do(a) Vereador(a) Carlos (PL), nos termos regimentais (art. 117 do Regimento Interno), apresenta MOÇÃO DE LOUVOR a campanha Y, pelos motivos a seguir expostos:",
    );
  });

  it("sem partido, omite os parênteses", () => {
    expect(
      corpoAberturaMocao({ tipo: "louvor", destinatario: "X", autorNome: "Carlos", autorPartido: null }),
    ).not.toContain("()");
  });

  it("sem autor cai no placeholder", () => {
    expect(
      corpoAberturaMocao({ tipo: "louvor", destinatario: "X", autorNome: "", autorPartido: null }),
    ).toContain("Vereador(a) [autor],");
  });
});

describe("fechoMocao", () => {
  it("formata a data por extenso", () => {
    expect(fechoMocao("2026-07-06")).toBe("Sala das Sessões, 06 de julho de 2026.");
  });
});
