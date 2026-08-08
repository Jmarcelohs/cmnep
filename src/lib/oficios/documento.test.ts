import { describe, expect, it } from "vitest";
import {
  aberturaOficio,
  corpoTextoEstaVazio,
  fraseEventoConvite,
  injetarAberturaHtml,
  numeroOficioFormatado,
  saudacaoSugerida,
} from "./documento";

describe("corpoTextoEstaVazio", () => {
  it("considera vazio o HTML que o editor manda sem texto nenhum", () => {
    expect(corpoTextoEstaVazio("<p><br></p>")).toBe(true);
    expect(corpoTextoEstaVazio("")).toBe(true);
    expect(corpoTextoEstaVazio("   ")).toBe(true);
  });

  it("não considera vazio quando há texto dentro das tags", () => {
    expect(corpoTextoEstaVazio("<p>texto</p>")).toBe(false);
  });
});

describe("numeroOficioFormatado", () => {
  it("monta o número no formato oficial", () => {
    expect(numeroOficioFormatado({ numero: "482", ano: 2026 })).toBe("OFÍCIO Nº 482/2026/SEC/CMN");
  });
});

describe("aberturaOficio", () => {
  it("requerimento: comunica em nome do autor, concordando o gênero", () => {
    expect(aberturaOficio({ tipo: "requerimento", autorNome: "João", autorGenero: "Vereador" })).toBe(
      "Comunico que o Vereador João, no uso de suas atribuições legais e regimentais, apresenta o presente REQUERIMENTO, com fundamento no artigo 113 do Regimento Interno, para que ",
    );
  });

  it("requerimento: acrescenta a cláusula de associação quando há segundo proponente", () => {
    expect(
      aberturaOficio({
        tipo: "requerimento",
        autorNome: "Maria",
        autorGenero: "Vereadora",
        autorAssociadoNome: "Pedro",
        autorAssociadoGenero: "Vereador",
      }),
    ).toBe(
      "Comunico que a Vereadora Maria, com associação do Vereador Pedro, no uso de suas atribuições legais e regimentais, apresenta o presente REQUERIMENTO, com fundamento no artigo 113 do Regimento Interno, para que ",
    );
  });

  it("requerimento sem autor cai no placeholder [autor]", () => {
    expect(aberturaOficio({ tipo: "requerimento" })).toContain("o Vereador [autor],");
  });

  it("indicação: frase própria com INDICAÇÃO em maiúsculas", () => {
    expect(aberturaOficio({ tipo: "indicacao", autorNome: "Ana", autorGenero: "Vereadora" })).toBe(
      "Por meio da presente INDICAÇÃO, a Vereadora Ana, no uso de suas atribuições legais e regimentais, indica que ",
    );
  });

  it("convite: sempre institucional, nunca cita autor", () => {
    expect(aberturaOficio({ tipo: "convite", autorNome: "Alguém" })).toBe(
      "Por meio do presente, tenho a honra de convidar Vossa Excelência para participar ",
    );
  });

  it("padrão sem autor: só a Câmara como remetente", () => {
    expect(aberturaOficio({ tipo: "padrao" })).toBe(
      "A Câmara Municipal de Nepomuceno vem, respeitosamente, à presença de Vossa Excelência, por meio do presente, solicitar ",
    );
  });

  it("padrão com autor: menciona a iniciativa em minúsculas", () => {
    expect(aberturaOficio({ tipo: "padrao", autorNome: "Carlos", autorGenero: "Vereador" })).toBe(
      "A Câmara Municipal de Nepomuceno, por iniciativa do vereador Carlos, vem, respeitosamente, à presença de Vossa Excelência, por meio do presente, solicitar ",
    );
  });
});

describe("saudacaoSugerida", () => {
  it("usa 'Senhor Prefeito' quando o cargo contém 'prefeito'", () => {
    expect(saudacaoSugerida("Excelentíssimo Senhor", "Prefeito Municipal de Nepomuceno")).toBe(
      "Senhor Prefeito,",
    );
  });

  it("usa 'Senhora Prefeita' pro tratamento feminino, mesma detecção de cargo", () => {
    expect(saudacaoSugerida("Excelentíssima Senhora", "Prefeita Municipal")).toBe("Senhora Prefeita,");
  });

  it("é insensível a maiúsculas/minúsculas na detecção do cargo", () => {
    expect(saudacaoSugerida("Excelentíssimo Senhor", "PREFEITO")).toBe("Senhor Prefeito,");
  });

  it("cai na saudação genérica pra qualquer outro cargo", () => {
    expect(saudacaoSugerida("Excelentíssimo Senhor", "Promotor de Justiça")).toBe(
      "Excelentíssimo Senhor,",
    );
    expect(saudacaoSugerida("Excelentíssima Senhora", "Secretária Municipal")).toBe(
      "Excelentíssima Senhora,",
    );
  });
});

describe("injetarAberturaHtml", () => {
  it("emenda a abertura dentro do primeiro <p> existente", () => {
    expect(injetarAberturaHtml("Comunico que ", "<p>o vereador solicita algo.</p>")).toBe(
      "<p>Comunico que o vereador solicita algo.</p>",
    );
  });

  it("cria um <p> próprio quando o corpo não começa com <p>", () => {
    expect(injetarAberturaHtml("Abertura ", "<ul><li>item</li></ul>")).toBe(
      "<p>Abertura </p><ul><li>item</li></ul>",
    );
  });

  it("escapa caracteres HTML da abertura antes de injetar", () => {
    expect(injetarAberturaHtml("A & B <teste> ", "<p>resto</p>")).toBe(
      "<p>A &amp; B &lt;teste&gt; resto</p>",
    );
  });
});

describe("fraseEventoConvite", () => {
  it("retorna null quando nenhum dado do evento foi preenchido", () => {
    expect(fraseEventoConvite({})).toBeNull();
  });

  it("combina data, hora e local quando todos preenchidos", () => {
    expect(
      fraseEventoConvite({ eventoData: "2026-07-06", eventoHora: "18h", eventoLocal: "Plenário" }),
    ).toBe("O evento será realizado no dia 06 de julho de 2026, às 18h, no Plenário.");
  });

  it("funciona só com a data", () => {
    expect(fraseEventoConvite({ eventoData: "2026-07-06" })).toBe(
      "O evento será realizado no dia 06 de julho de 2026.",
    );
  });

  it("funciona só com o local", () => {
    expect(fraseEventoConvite({ eventoLocal: "Plenário" })).toBe(
      "O evento será realizado, no Plenário.",
    );
  });
});
