import { describe, expect, it } from "vitest";
import {
  montarCorpoAtoPadrao,
  montarCorpoDecretoPadrao,
  numeroRomano,
  rotuloFicha,
  segmentosFicha,
  valorPorExtensoMinusculo,
} from "./documento";
import type { DotacaoOrcamentaria, ItemSuplementacao } from "./documento";

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

describe("rotuloFicha", () => {
  it("mostra a codificação orçamentária completa, sem saldo/valor", () => {
    expect(rotuloFicha(FICHA_22)).toBe(
      "Ficha 22 — 01.01.031.0001.2001.339039.1500 — Outros Serviços de Terceiros - Pessoa Jurídica (Manutenção das Atividades do Legislativo Municipal)",
    );
  });
});

describe("valorPorExtensoMinusculo", () => {
  it("começa com minúscula (encaixa depois de 'no valor total de R$X (...)')", () => {
    expect(valorPorExtensoMinusculo(53000)).toBe("cinquenta e três mil reais");
  });
});

const FICHA_21: DotacaoOrcamentaria = {
  ...FICHA_22,
  id: "id-21",
  ficha: 21,
  elemento_codigo: "339036",
  elemento_nome: "Outros Serviços de Terceiros - Pessoa Física",
};

const ITENS_DESTINO: ItemSuplementacao[] = [{ valor: 53000, dotacao: FICHA_22 }];
const ITENS_ORIGEM: ItemSuplementacao[] = [{ valor: 53000, dotacao: FICHA_21 }];

describe("montarCorpoAtoPadrao", () => {
  const html = montarCorpoAtoPadrao({
    dataAto: "2026-05-12",
    itensDestino: ITENS_DESTINO,
    itensOrigem: ITENS_ORIGEM,
  });

  it("só usa tags que o sanitizador aceita (p/strong/br)", () => {
    const tagsUsadas = [...html.matchAll(/<\/?([a-z]+)/gi)].map((m) => m[1].toLowerCase());
    expect(new Set(tagsUsadas)).toEqual(new Set(["p", "strong", "br"]));
  });

  it("inclui título, ementa, preâmbulo e os 3 artigos", () => {
    expect(html).toContain("ATO DA MESA DIRETORA DE 12 DE MAIO DE 2026");
    expect(html).toContain("Abre crédito suplementar no Orçamento vigente da Câmara Municipal.");
    expect(html).toContain("RESOLVE:");
    expect(html).toContain("<strong>Art.1º</strong>");
    expect(html).toContain("Ficha 22");
    expect(html).toContain("<strong>Art.2º</strong>");
    expect(html).toContain("Ficha 21");
    expect(html).toContain("<strong>Art.3º</strong>");
  });

  it("não duplica 'Total Geral' quando só há 1 item por artigo", () => {
    expect(html).not.toContain("Total Geral");
  });

  it("separa a última linha da ficha do 'Total' com uma linha em branco", () => {
    expect(html).toContain("Recursos Ordinários R$ 53.000,00<br><br>Total: R$ 53.000,00");
  });

  it("reduz a fonte do bloco da ficha (10pt) pra caber o nome mais longo numa linha só", () => {
    expect(html).toContain('<p style="font-size:10pt">I<br>Ficha 22');
  });

  it("soma 'Total Geral' quando há mais de 1 item no mesmo artigo", () => {
    const comDoisItens = montarCorpoAtoPadrao({
      dataAto: "2026-05-12",
      itensDestino: [...ITENS_DESTINO, { valor: 1000, dotacao: FICHA_21 }],
      itensOrigem: ITENS_ORIGEM,
    });
    expect(comDoisItens).toContain("Total Geral: R$ 54.000,00");
  });
});

describe("montarCorpoDecretoPadrao", () => {
  it("usa a redação do Decreto (DECRETA, sem ponto na ementa)", () => {
    const html = montarCorpoDecretoPadrao({
      numeroDecreto: "2.342",
      dataDecreto: "2026-05-12",
      itensDestino: ITENS_DESTINO,
      itensOrigem: ITENS_ORIGEM,
    });
    expect(html).toContain("DECRETO Nº 2.342 DE 12 DE MAIO DE 2026");
    expect(html).toContain("Abre crédito adicional suplementar no Orçamento vigente da Câmara Municipal</strong>");
    expect(html).toContain("DECRETA:");
  });

  it("usa '___' quando o número ainda não foi preenchido", () => {
    const html = montarCorpoDecretoPadrao({
      numeroDecreto: "",
      dataDecreto: "2026-05-12",
      itensDestino: ITENS_DESTINO,
      itensOrigem: ITENS_ORIGEM,
    });
    expect(html).toContain("DECRETO Nº ___ DE");
  });
});
