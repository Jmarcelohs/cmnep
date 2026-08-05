import { describe, expect, it } from "vitest";
import { validarArquivos } from "./validacao";

function arquivoFalso(nome: string, tamanhoBytes: number, tipo: string): File {
  const conteudo = new Uint8Array(tamanhoBytes);
  return new File([conteudo], nome, { type: tipo });
}

const OPCOES = { limiteBytes: 10 * 1024 * 1024, tiposAceitos: ["image/jpeg", "application/pdf"] };

describe("validarArquivos", () => {
  it("aceita arquivo dentro do limite e do tipo certo", () => {
    const arquivo = arquivoFalso("foto.jpg", 1024, "image/jpeg");
    expect(validarArquivos([arquivo], OPCOES)).toBeNull();
  });

  it("rejeita arquivo maior que o limite", () => {
    const arquivo = arquivoFalso("grande.pdf", 11 * 1024 * 1024, "application/pdf");
    const erro = validarArquivos([arquivo], OPCOES);
    expect(erro).toContain("grande.pdf");
    expect(erro).toContain("10MB");
  });

  it("rejeita tipo de arquivo não aceito", () => {
    const arquivo = arquivoFalso("planilha.xlsx", 1024, "application/vnd.ms-excel");
    const erro = validarArquivos([arquivo], OPCOES);
    expect(erro).toContain("planilha.xlsx");
  });

  it("aceita arquivo exatamente no limite", () => {
    const arquivo = arquivoFalso("limite.pdf", 10 * 1024 * 1024, "application/pdf");
    expect(validarArquivos([arquivo], OPCOES)).toBeNull();
  });

  it("rejeita no primeiro arquivo inválido de uma lista, mesmo com outros válidos antes", () => {
    const valido = arquivoFalso("ok.jpg", 1024, "image/jpeg");
    const invalido = arquivoFalso("grande.pdf", 20 * 1024 * 1024, "application/pdf");
    const erro = validarArquivos([valido, invalido], OPCOES);
    expect(erro).toContain("grande.pdf");
  });

  it("retorna null pra lista vazia", () => {
    expect(validarArquivos([], OPCOES)).toBeNull();
  });
});
