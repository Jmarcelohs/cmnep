import { describe, expect, it } from "vitest";
import { corpoAberturaMocao, fechoMocao, fraseApresentacaoMocao, tituloMocao } from "./documento";

describe("tituloMocao", () => {
  it("retorna o rótulo em maiúsculas", () => {
    expect(tituloMocao("aplauso_congratulacoes")).toBe("MOÇÃO DE APLAUSO E CONGRATULAÇÕES");
    expect(tituloMocao("pesar_condolencias")).toBe("MOÇÃO DE PESAR E CONDOLÊNCIAS");
    expect(tituloMocao("repudio")).toBe("MOÇÃO DE REPÚDIO");
    expect(tituloMocao("apoio")).toBe("MOÇÃO DE APOIO");
  });
});

describe("fraseApresentacaoMocao", () => {
  it("aplauso e congratulações: dirigida a alguém", () => {
    expect(fraseApresentacaoMocao({ tipo: "aplauso_congratulacoes", destinatario: "Maria Silva" })).toBe(
      "apresenta MOÇÃO DE APLAUSO E CONGRATULAÇÕES a Maria Silva, pelos motivos a seguir expostos:",
    );
  });

  it("pesar e condolências: menciona o falecimento", () => {
    expect(fraseApresentacaoMocao({ tipo: "pesar_condolencias", destinatario: "João Souza" })).toBe(
      "apresenta MOÇÃO DE PESAR, com apresentação de condolências, pelo falecimento de João Souza, pelos motivos a seguir expostos:",
    );
  });

  it("repúdio: 'em relação a'", () => {
    expect(fraseApresentacaoMocao({ tipo: "repudio", destinatario: "medida X" })).toBe(
      "apresenta MOÇÃO DE REPÚDIO em relação a medida X, pelos motivos a seguir expostos:",
    );
  });

  it("apoio: 'a'", () => {
    expect(fraseApresentacaoMocao({ tipo: "apoio", destinatario: "campanha Y" })).toBe(
      "apresenta MOÇÃO DE APOIO a campanha Y, pelos motivos a seguir expostos:",
    );
  });

  it("sem destinatário cai no placeholder", () => {
    expect(fraseApresentacaoMocao({ tipo: "apoio", destinatario: "" })).toContain("a [destinatário],");
  });
});

describe("corpoAberturaMocao", () => {
  it("monta a abertura com autor e partido", () => {
    expect(
      corpoAberturaMocao({
        tipo: "apoio",
        destinatario: "campanha Y",
        autorNome: "Carlos",
        autorPartido: "PL",
      }),
    ).toBe(
      "A Câmara Municipal de Nepomuceno – MG, por intermédio do(a) Vereador(a) Carlos (PL), nos termos regimentais, apresenta MOÇÃO DE APOIO a campanha Y, pelos motivos a seguir expostos:",
    );
  });

  it("sem partido, omite os parênteses", () => {
    expect(
      corpoAberturaMocao({ tipo: "apoio", destinatario: "X", autorNome: "Carlos", autorPartido: null }),
    ).not.toContain("()");
  });

  it("sem autor cai no placeholder", () => {
    expect(
      corpoAberturaMocao({ tipo: "apoio", destinatario: "X", autorNome: "", autorPartido: null }),
    ).toContain("Vereador(a) [autor],");
  });
});

describe("fechoMocao", () => {
  it("formata a data por extenso", () => {
    expect(fechoMocao("2026-07-06")).toBe("Sala das Sessões, 06 de julho de 2026.");
  });
});
