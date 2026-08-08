export function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, "");
}

export function formatarCpfDigitado(valor: string): string {
  const digitos = apenasDigitos(valor).slice(0, 11);
  const partes = [digitos.slice(0, 3), digitos.slice(3, 6), digitos.slice(6, 9), digitos.slice(9, 11)].filter(
    Boolean,
  );

  let texto = partes[0] ?? "";
  if (partes[1]) texto += `.${partes[1]}`;
  if (partes[2]) texto += `.${partes[2]}`;
  if (partes[3]) texto += `-${partes[3]}`;
  return texto;
}

// Máscara de moeda "digitando da direita pra esquerda": trata o texto
// digitado como centavos (ex.: "282582" → R$ 2.825,82).
export function formatarValorDigitado(valorDigitado: string): { texto: string; valor: number } {
  const digitos = apenasDigitos(valorDigitado);
  const centavos = Number(digitos || "0");
  const valor = centavos / 100;
  const texto = valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return { texto, valor };
}

function digitoVerificadorCpf(base: string, pesoInicial: number): number {
  let soma = 0;
  for (let i = 0; i < base.length; i++) {
    soma += Number(base[i]) * (pesoInicial - i);
  }
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

// Valida o dígito verificador do CPF (aceita com ou sem máscara). Rejeita
// tamanho diferente de 11 dígitos e sequências de dígito repetido
// (ex.: 111.111.111-11) — passam no cálculo do dígito verificador, mas são
// CPFs conhecidos como inválidos/placeholder, nunca emitidos de verdade.
export function cpfValido(cpf: string): boolean {
  const digitos = apenasDigitos(cpf);
  if (digitos.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digitos)) return false;

  const digito1 = digitoVerificadorCpf(digitos.slice(0, 9), 10);
  const digito2 = digitoVerificadorCpf(digitos.slice(0, 10), 11);

  return digito1 === Number(digitos[9]) && digito2 === Number(digitos[10]);
}
