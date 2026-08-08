import { describe, expect, it } from "vitest";
import { corpoRequerimentoInterno, paragrafoDecisao } from "./documento";

describe("corpoRequerimentoInterno", () => {
  it("usa o template estruturado quando o assunto tem campos (ex.: Férias)", () => {
    const texto = corpoRequerimentoInterno({
      tipo: "rh",
      assuntoKey: "ferias",
      nome: "João Souza",
      cargo: "Servidor(a)",
      cpf: "12345678901",
      matricula: "1199",
      fundamento: "Lei Municipal nº 629/2017",
      campos: { dataInicio: "2026-08-01", dataFim: "2026-08-15" },
      pedido: null,
    });
    expect(texto).toBe(
      "Eu, João Souza, Servidor(a), inscrito(a) no CPF sob o nº 12345678901, matrícula nº 1199, " +
        "venho requerer ao Ilmo. Presidente da Câmara Municipal de Nepomuceno – MG, Tullio Ian " +
        "Marangoni de Morais, com fundamento em Lei Municipal nº 629/2017, o seguinte: Férias, " +
        "considerando: Data de Início do Gozo: 01/08/2026; Data de Fim do Gozo: 15/08/2026.",
    );
  });

  it("cai no template manual quando não há assuntoKey", () => {
    const texto = corpoRequerimentoInterno({
      tipo: "rh",
      assuntoKey: null,
      nome: "Maria",
      cargo: "Vereadora",
      cpf: null,
      matricula: null,
      fundamento: null,
      campos: {},
      pedido: "emissão de declaração de tempo de serviço",
    });
    expect(texto).toBe(
      "Eu, Maria, Vereadora, inscrito(a) no CPF sob o nº —, venho, através deste, requerer ao " +
        "Ilmo. Presidente da Câmara Municipal de Nepomuceno – MG, Tullio Ian Marangoni de Morais, " +
        "o seguinte: emissão de declaração de tempo de serviço",
    );
  });

  it("usa o placeholder de pedido quando o modo manual não recebe texto", () => {
    const texto = corpoRequerimentoInterno({
      tipo: "geral",
      assuntoKey: null,
      nome: "Alguém",
      cargo: "Servidor(a)",
      cpf: null,
      matricula: null,
      fundamento: null,
      campos: {},
      pedido: null,
    });
    expect(texto).toContain("o seguinte: [descrição do pedido]");
  });

  it("omite do texto os campos estruturados não preenchidos", () => {
    const texto = corpoRequerimentoInterno({
      tipo: "rh",
      assuntoKey: "ferias",
      nome: "João",
      cargo: "Servidor(a)",
      cpf: null,
      matricula: null,
      fundamento: null,
      campos: { dataInicio: "2026-08-01" }, // dataFim não preenchida
      pedido: null,
    });
    expect(texto).toContain("considerando: Data de Início do Gozo: 01/08/2026.");
    expect(texto).not.toContain("Data de Fim do Gozo");
  });
});

describe("paragrafoDecisao", () => {
  it("marca nenhum X quando ainda não há decisão", () => {
    expect(paragrafoDecisao({ decisao: null, fundamento: null })).toBe(
      "Observado o pedido acima, eu, Tullio Ian Marangoni de Morais, Presidente da Câmara " +
        "Municipal de Nepomuceno – MG, autorizo (   ) ; não autorizo (   ) ; o requerido.",
    );
  });

  it("marca o X em 'autorizo' e acrescenta o fundamento quando informado", () => {
    expect(paragrafoDecisao({ decisao: "autorizado", fundamento: "Lei X" })).toBe(
      "Observado o pedido acima, eu, Tullio Ian Marangoni de Morais, Presidente da Câmara " +
        "Municipal de Nepomuceno – MG, autorizo ( X ) ; não autorizo (   ) ; o requerido, " +
        "conforme previsto em Lei X.",
    );
  });

  it("marca o X em 'não autorizo'", () => {
    expect(paragrafoDecisao({ decisao: "nao_autorizado", fundamento: null })).toBe(
      "Observado o pedido acima, eu, Tullio Ian Marangoni de Morais, Presidente da Câmara " +
        "Municipal de Nepomuceno – MG, autorizo (   ) ; não autorizo ( X ) ; o requerido.",
    );
  });
});
