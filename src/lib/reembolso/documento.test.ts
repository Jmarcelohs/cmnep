import { describe, expect, it } from "vitest";
import { buildReferenteA, corpoReembolso } from "./documento";

describe("buildReferenteA", () => {
  it("monta o assunto a partir do rótulo do sub-assunto", () => {
    expect(buildReferenteA("combustivel")).toBe(
      "Reembolso de Despesas — combustível e estacionamento",
    );
  });
});

describe("corpoReembolso", () => {
  it("monta o texto padrão sem cláusula de veículo pra sub-assuntos que não são combustível", () => {
    const texto = corpoReembolso({
      nome: "Ana Souza",
      cargoDeclarado: "Servidor(a)",
      cpf: "12345678901",
      subassunto: "locomocao",
      dataIda: "2026-07-21",
      dataVolta: "2026-07-24",
      municipio: "Belo Horizonte - MG",
      valor: 381.85,
    });
    expect(texto).toBe(
      "Ana Souza, Servidor(a), portador(a) do CPF nº 123.456.789-01, vem respeitosamente " +
        "requerer a Vossa Excelência, com fundamento no Art. 9º da Resolução nº 40, de 04 de " +
        "abril de 2023, o reembolso de locomoção urbana (Uber, táxi e outros), referente à " +
        "viagem ao município de Belo Horizonte - MG, realizada no período de 21/07/2026 a " +
        "24/07/2026, no valor de R$ 381,85 (Trezentos e oitenta e um reais e oitenta e cinco " +
        "centavos), solicitando o pagamento pelos meios de praxe.",
    );
  });

  it("acrescenta a cláusula de veículo (placa/modelo) só pro sub-assunto combustível", () => {
    const texto = corpoReembolso({
      nome: "Carlos",
      cargoDeclarado: "Vereador",
      cpf: null,
      subassunto: "combustivel",
      dataIda: "2026-07-01",
      dataVolta: "2026-07-02",
      municipio: "Lavras",
      valor: 100,
      placaVeiculo: "ABC-1234",
      modeloVeiculo: "Gol",
    });
    expect(texto).toBe(
      "Carlos, Vereador, portador(a) do CPF nº —, vem respeitosamente requerer a Vossa " +
        "Excelência, com fundamento no Art. 9º da Resolução nº 40, de 04 de abril de 2023, o " +
        "reembolso de combustível e estacionamento. Veículo locado pela Câmara Municipal de " +
        "Nepomuceno, placa ABC-1234, modelo Gol, referente à viagem ao município de Lavras, " +
        "realizada no período de 01/07/2026 a 02/07/2026, no valor de R$ 100,00 (Cem reais), " +
        "solicitando o pagamento pelos meios de praxe.",
    );
  });

  it("não acrescenta a cláusula de veículo em combustível sem placa nem modelo", () => {
    const texto = corpoReembolso({
      nome: "Carlos",
      cargoDeclarado: "Vereador",
      cpf: null,
      subassunto: "combustivel",
      dataIda: "2026-07-01",
      dataVolta: "2026-07-02",
      municipio: "Lavras",
      valor: 100,
    });
    expect(texto).not.toContain("Veículo locado");
  });

  it("usa reticências/travessão como placeholder pra campos ausentes", () => {
    const texto = corpoReembolso({
      nome: "",
      cargoDeclarado: "Servidor(a)",
      cpf: null,
      subassunto: "passagem_aerea",
      dataIda: null,
      dataVolta: null,
      municipio: "",
      valor: 0,
    });
    expect(texto).toBe(
      "[solicitante], Servidor(a), portador(a) do CPF nº —, vem respeitosamente requerer a " +
        "Vossa Excelência, com fundamento no Art. 9º da Resolução nº 40, de 04 de abril de " +
        "2023, o reembolso de passagem aérea, referente à viagem ao município de [município], " +
        "realizada no período de — a —, no valor de R$ 0,00 (Zero reais), solicitando o " +
        "pagamento pelos meios de praxe.",
    );
  });
});
