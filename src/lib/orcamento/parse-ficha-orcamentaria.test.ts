import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { parseFichaOrcamentaria } from "./parse-ficha-orcamentaria";

// Fixture real: 5 páginas do relatório "Ficha Orçamentária" do Betha
// Sistemas (dado público de transparência), extraído via
// `pdftotext -layout -enc UTF-8`. Valores conferidos à mão contra o seed
// de dotacoes_orcamentarias em supabase/migrations/0046_suplementacoes_orcamentarias.sql
// (ex.: ficha 3 — dotação inicial 50.000,00, empenhado 1.750,00, saldo
// 48.250,00, batendo com o saldo_referencia já gravado lá).
const textoExemplo = readFileSync(
  join(__dirname, "__fixtures__", "ficha-orcamentaria-exemplo.txt"),
  "utf-8",
);

describe("parseFichaOrcamentaria", () => {
  it("extrai as 5 fichas do fixture sem avisos", () => {
    const { fichas, avisos } = parseFichaOrcamentaria(textoExemplo);
    expect(avisos).toEqual([]);
    expect(fichas).toHaveLength(5);
  });

  it("casa cada ficha pelos códigos (projeto/atividade, elemento, fonte), não pelo nome", () => {
    const { fichas } = parseFichaOrcamentaria(textoExemplo);

    // Ficha 1: Obras e Instalações
    expect(fichas[0]).toMatchObject({
      projetoAtividadeCodigo: "1001",
      elementoCodigo: "449051",
      fonteCodigo: "1500",
      dotacaoInicial: 10000,
      empenhado: 0,
      suplementado: -10000,
      saldo: 0,
    });

    // Ficha 2: Equipamentos e Material Permanente
    expect(fichas[1]).toMatchObject({
      projetoAtividadeCodigo: "1002",
      elementoCodigo: "449052",
      fonteCodigo: "1500",
      dotacaoInicial: 1000,
      empenhado: 0,
      suplementado: -1000,
      saldo: 0,
    });

    // Ficha 3: saldo bate com o já cadastrado (48.250,00)
    expect(fichas[2]).toMatchObject({
      projetoAtividadeCodigo: "1003",
      elementoCodigo: "449051",
      fonteCodigo: "1500",
      dotacaoInicial: 50000,
      empenhado: 1750,
      suplementado: 0,
      saldo: 48250,
    });

    // Ficha 4: suplementado negativo (redução)
    expect(fichas[3]).toMatchObject({
      projetoAtividadeCodigo: "2001",
      elementoCodigo: "319004",
      fonteCodigo: "1500",
      dotacaoInicial: 1000,
      empenhado: 0,
      suplementado: -1000,
      saldo: 0,
    });

    // Ficha 5: valores grandes (milhões) e negativo — o layout não muda
    expect(fichas[4]).toMatchObject({
      projetoAtividadeCodigo: "2001",
      elementoCodigo: "319011",
      fonteCodigo: "1500",
      dotacaoInicial: 2309329,
      empenhado: 1494115.75,
      suplementado: -45782.96,
      saldo: 769430.29,
    });
  });

  it("devolve nomes de campo úteis pra conferência humana (mesmo sem acento no relatório)", () => {
    const { fichas } = parseFichaOrcamentaria(textoExemplo);
    expect(fichas[0].elementoNome).toBe("OBRAS E INSTALACOES");
  });

  it("texto vazio não gera fichas nem lança erro", () => {
    const { fichas, avisos } = parseFichaOrcamentaria("");
    expect(fichas).toEqual([]);
    expect(avisos).toEqual([]);
  });
});
