// Checagem no navegador antes de tentar o upload — o Supabase Storage já
// recusa arquivo grande demais ou de tipo errado no servidor (configurado
// no bucket), mas sem essa checagem aqui o usuário só descobre isso depois
// de esperar o envio começar/travar. Valida TODOS os arquivos escolhidos
// antes de mandar qualquer um, pra não deixar upload parcial (alguns
// arquivos enviados, outros recusados no meio da lista).
export function validarArquivos(
  arquivos: File[],
  { limiteBytes, tiposAceitos }: { limiteBytes: number; tiposAceitos: string[] },
): string | null {
  for (const arquivo of arquivos) {
    if (!tiposAceitos.includes(arquivo.type)) {
      return `"${arquivo.name}" não é um tipo de arquivo aceito.`;
    }
    if (arquivo.size > limiteBytes) {
      const limiteMB = (limiteBytes / (1024 * 1024)).toFixed(0);
      const tamanhoMB = (arquivo.size / (1024 * 1024)).toFixed(1);
      return `"${arquivo.name}" tem ${tamanhoMB}MB — o limite é ${limiteMB}MB.`;
    }
  }
  return null;
}

const REGEX_MARCAS_DIACRITICAS = new RegExp("[\\u0300-\\u036f]", "g");

// O Supabase Storage recusa chaves de objeto com certos caracteres
// (acentuação, espaço, "º"/"ª", etc.) com erro "Invalid key" — comum em
// nome de arquivo brasileiro (ex.: "RESOLUÇÃO Nº35-2022.pdf"). Sanitiza só
// o nome usado no CAMINHO de armazenamento; o nome original (acentuado,
// como o usuário escolheu) continua guardado à parte pra exibição.
export function sanitizarNomeArquivo(nome: string): string {
  const semAcentos = nome.normalize("NFD").replace(REGEX_MARCAS_DIACRITICAS, "");
  return semAcentos.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
}
