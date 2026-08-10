import { describe, expect, it } from "vitest";
import {
  aberturaCongratulacaoSegmentos,
  aberturaPesarSegmentos,
  associadosComPresidenteObrigatorio,
  enderecamentoPesarSegmentos,
  fechoMocao,
  legendaAssinatura,
  listaComE,
  ordenarSignatarios,
  type VereadorSignatario,
} from "./documento";

function vereador(nome: string, overrides: Partial<VereadorSignatario> = {}): VereadorSignatario {
  return {
    id: nome,
    nome,
    partido: null,
    genero: "Vereador",
    presidente: false,
    assinaturaCaminho: null,
    ...overrides,
  };
}

describe("listaComE", () => {
  it("lista vazia", () => {
    expect(listaComE([])).toBe("");
  });

  it("um nome", () => {
    expect(listaComE(["Ana"])).toBe("Ana");
  });

  it("dois ou mais nomes, com 'e' antes do último", () => {
    expect(listaComE(["Ana", "Bruno"])).toBe("Ana e Bruno");
    expect(listaComE(["Ana", "Bruno", "Carlos"])).toBe("Ana, Bruno e Carlos");
  });
});

describe("ordenarSignatarios", () => {
  it("ordena por nome, alfabético", () => {
    const ordenado = ordenarSignatarios([vereador("Rogério"), vereador("Ana"), vereador("Bruno")]);
    expect(ordenado.map((v) => v.nome)).toEqual(["Ana", "Bruno", "Rogério"]);
  });

  it("Presidente sempre por último, mesmo vindo antes no alfabeto", () => {
    const ordenado = ordenarSignatarios([
      vereador("Tullio", { presidente: true }),
      vereador("Vanessa"),
      vereador("Ana"),
    ]);
    expect(ordenado.map((v) => v.nome)).toEqual(["Ana", "Vanessa", "Tullio"]);
  });

  it("sem Presidente na lista, só ordena alfabético", () => {
    const ordenado = ordenarSignatarios([vereador("Bruno"), vereador("Ana")]);
    expect(ordenado.map((v) => v.nome)).toEqual(["Ana", "Bruno"]);
  });
});

describe("legendaAssinatura", () => {
  it("vereador comum — não cita o partido, mesmo cadastrado", () => {
    expect(legendaAssinatura(vereador("Ana", { partido: "PL" }))).toBe(
      "Vereador da Câmara Municipal de Nepomuceno",
    );
  });

  it("vereadora (gênero feminino) — não cita o partido", () => {
    expect(legendaAssinatura(vereador("Ana", { genero: "Vereadora", partido: "PT" }))).toBe(
      "Vereadora da Câmara Municipal de Nepomuceno",
    );
  });

  it("sem partido cadastrado", () => {
    expect(legendaAssinatura(vereador("Ana"))).toBe("Vereador da Câmara Municipal de Nepomuceno");
  });

  it("Presidente ignora gênero/partido na legenda", () => {
    expect(legendaAssinatura(vereador("Tullio", { presidente: true, partido: "PL" }))).toBe(
      "Presidente da Câmara Municipal de Nepomuceno",
    );
  });
});

describe("aberturaCongratulacaoSegmentos", () => {
  it("sem associados", () => {
    const segmentos = aberturaCongratulacaoSegmentos({ autorNome: "Mário", associadosNomes: [] });
    expect(segmentos.map((s) => s.texto).join("")).toBe(
      "A Câmara Municipal de Nepomuceno, no uso de suas atribuições legais e a requerimento do Vereador MÁRIO homenageia",
    );
  });

  it("com associados, nomes em negrito", () => {
    const segmentos = aberturaCongratulacaoSegmentos({
      autorNome: "Mário Cezar",
      associadosNomes: ["Marcos", "Rogério"],
    });
    expect(segmentos.map((s) => s.texto).join("")).toBe(
      "A Câmara Municipal de Nepomuceno, no uso de suas atribuições legais e a requerimento do Vereador MÁRIO CEZAR, em associação dos Vereadores MARCOS e ROGÉRIO homenageia",
    );
    expect(segmentos.filter((s) => s.negrito).map((s) => s.texto)).toEqual([
      "MÁRIO CEZAR",
      "MARCOS e ROGÉRIO",
    ]);
  });
});

describe("enderecamentoPesarSegmentos", () => {
  it("tratamento Sr.", () => {
    const segmentos = enderecamentoPesarSegmentos({
      destinatarioNome: "Antônio Antunes Almeida",
      destinatarioTratamento: "Sr.",
    });
    expect(segmentos.map((s) => s.texto).join("")).toBe(
      "À Família do Senhor Antônio Antunes Almeida.",
    );
  });

  it("tratamento Sra.", () => {
    const segmentos = enderecamentoPesarSegmentos({
      destinatarioNome: "Maria Silva",
      destinatarioTratamento: "Sra.",
    });
    expect(segmentos.map((s) => s.texto).join("")).toBe("À Família da Senhora Maria Silva.");
  });
});

describe("aberturaPesarSegmentos", () => {
  it("autora mulher, com associados mistos", () => {
    const segmentos = aberturaPesarSegmentos({
      autorNome: "Luciane Souza Lima",
      autorGenero: "Vereadora",
      associadosNomes: ["Elder Wander de Carvalho", "Vanessa Aguiar de Souza"],
      destinatarioNome: "Antônio Antunes Almeida",
      destinatarioTratamento: "Sr.",
    });
    expect(segmentos.map((s) => s.texto).join("")).toBe(
      "A Câmara Municipal de Nepomuceno, por meio da vereadora LUCIANE SOUZA LIMA, em associação dos vereadores ELDER WANDER DE CARVALHO e VANESSA AGUIAR DE SOUZA, manifesta profundo pesar pelo falecimento do Senhor Antônio Antunes Almeida, registrando sua solidariedade e respeito neste momento de dor e despedida.",
    );
  });

  it("autor homem, sem associados", () => {
    const segmentos = aberturaPesarSegmentos({
      autorNome: "Mário",
      autorGenero: "Vereador",
      associadosNomes: [],
      destinatarioNome: "Maria",
      destinatarioTratamento: "Sra.",
    });
    expect(segmentos.map((s) => s.texto).join("")).toBe(
      "A Câmara Municipal de Nepomuceno, por meio do vereador MÁRIO, manifesta profundo pesar pelo falecimento da Senhora Maria, registrando sua solidariedade e respeito neste momento de dor e despedida.",
    );
  });
});

describe("fechoMocao", () => {
  it("formata a data por extenso, com ponto final", () => {
    expect(fechoMocao("2026-05-11")).toBe("Nepomuceno, 11 de maio de 2026.");
  });
});

describe("associadosComPresidenteObrigatorio", () => {
  const presidente = vereador("Tullio", { presidente: true });

  it("adiciona o Presidente se ele não estiver na lista", () => {
    const associados = [vereador("Ana")];
    const resultado = associadosComPresidenteObrigatorio({ id: "Mário" }, associados, presidente);
    expect(resultado.map((v) => v.nome)).toEqual(["Ana", "Tullio"]);
  });

  it("não duplica se o Presidente já estiver nos associados", () => {
    const associados = [vereador("Ana"), presidente];
    const resultado = associadosComPresidenteObrigatorio({ id: "Mário" }, associados, presidente);
    expect(resultado).toHaveLength(2);
  });

  it("não adiciona se o Presidente for o próprio autor", () => {
    const associados = [vereador("Ana")];
    const resultado = associadosComPresidenteObrigatorio(
      { id: presidente.id },
      associados,
      presidente,
    );
    expect(resultado).toEqual(associados);
  });

  it("sem presidente cadastrado, devolve a lista original", () => {
    const associados = [vereador("Ana")];
    expect(associadosComPresidenteObrigatorio({ id: "Mário" }, associados, null)).toBe(associados);
  });
});
