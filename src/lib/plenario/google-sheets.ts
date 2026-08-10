import { JWT } from "google-auth-library";
import { serialParaData, serialParaHora } from "./serial";

const ESCOPO = "https://www.googleapis.com/auth/spreadsheets.readonly";

export type SolicitacaoPlenario = {
  respostaTimestamp: string;
  numeroRequerimento: string;
  nomeSolicitante: string;
  cpfCnpj: string;
  telefone: string;
  instituicao: string;
  finalidade: string;
  dataDesejada: string;
  horaInicio: string;
  horaFim: string;
  numeroParticipantes: string;
  tipoEvento: string;
  equipamentos: string;
  observacoes: string;
};

// Duplicado de propósito em relação a src/lib/agenda/google-calendar.ts —
// mesma conta de serviço, mesma checagem de chave corrompida, mas não
// compartilhados: depois do trabalho que deu deixar a autenticação da
// Agenda estável em produção, não vale a pena arriscar mexer nela só por
// DRY entre dois módulos pequenos.
function criarClienteAutenticado(): JWT {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const chaveB64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64?.trim();
  if (!email || !chaveB64) {
    throw new Error("Variáveis de ambiente da conta de serviço do Google não configuradas");
  }

  const key = Buffer.from(chaveB64, "base64").toString("utf8");
  if (!key.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error(
      "A chave da conta de serviço do Google (GOOGLE_SERVICE_ACCOUNT_KEY_B64) parece corrompida ou incompleta — confira se o valor foi colado inteiro, sem quebras no meio.",
    );
  }

  return new JWT({ email, key, scopes: [ESCOPO] });
}

function idDaPlanilha(): string {
  const id = process.env.GOOGLE_PLENARIO_SPREADSHEET_ID;
  if (!id) throw new Error("GOOGLE_PLENARIO_SPREADSHEET_ID não configurado");
  return id;
}

function statusDoErro(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const comStatus = err as { status?: number; response?: { status?: number } };
  return comStatus.status ?? comStatus.response?.status;
}

async function requisitar<T>(client: JWT, opts: { url: string; method: string }): Promise<T> {
  try {
    const res = await client.request<T>(opts);
    return res.data;
  } catch (err) {
    if (statusDoErro(err) === 403) {
      throw new Error(
        "Sem permissão de acesso à planilha de solicitações — verifique se o compartilhamento com a conta de serviço não foi revogado.",
      );
    }
    throw err;
  }
}

async function nomeDaPrimeiraAba(client: JWT, spreadsheetId: string): Promise<string> {
  const dados = await requisitar<{ sheets?: { properties?: { title?: string } }[] }>(client, {
    url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    method: "GET",
  });
  const titulo = dados.sheets?.[0]?.properties?.title;
  if (!titulo) throw new Error("Não foi possível encontrar a aba de respostas na planilha");
  return titulo;
}

function coluna(cabecalho: string[], linha: unknown[], nome: string): unknown {
  const indice = cabecalho.indexOf(nome);
  return indice === -1 ? undefined : linha[indice];
}

function textoColuna(cabecalho: string[], linha: unknown[], nome: string): string {
  const valor = coluna(cabecalho, linha, nome);
  return valor === undefined || valor === null ? "" : String(valor);
}

// Datas/horas vêm como número serial (valueRenderOption=UNFORMATTED_VALUE)
// — ver src/lib/plenario/serial.ts pro porquê de não usar o texto
// formatado da planilha.
function dataColuna(cabecalho: string[], linha: unknown[], nome: string): string {
  const valor = coluna(cabecalho, linha, nome);
  return typeof valor === "number" ? serialParaData(valor) : "";
}

function horaColuna(cabecalho: string[], linha: unknown[], nome: string): string {
  const valor = coluna(cabecalho, linha, nome);
  return typeof valor === "number" ? serialParaHora(valor) : "";
}

// "Carimbo de data/hora" também vem como serial (é uma célula de
// data+hora) — convertido pra ISO em vez de deixar o número cru
// stringificado (ex.: "46203.57151100694"), que funcionaria como chave
// única mas é ilegível e arrisca diferenças de precisão de ponto
// flutuante entre leituras.
//
// Algumas linhas foram lançadas manualmente na planilha (não vieram do
// formulário) e por isso não têm "Carimbo de data/hora" — nesses casos
// caímos pra "Data da Solicitação" (só data, sem hora) como aproximação,
// em vez de deixar a linha sem timestamp válido (o que quebraria a
// numeração sequencial por ano).
function timestampColuna(cabecalho: string[], linha: unknown[], nome: string): string {
  const valor = coluna(cabecalho, linha, nome);
  if (typeof valor === "number") return `${serialParaData(valor)}T${serialParaHora(valor)}`;

  const fallback = coluna(cabecalho, linha, "Data da Solicitação");
  if (typeof fallback === "number") return `${serialParaData(fallback)}T00:00:00`;

  return textoColuna(cabecalho, linha, nome);
}

function paraSolicitacao(cabecalho: string[], linha: unknown[]): SolicitacaoPlenario {
  return {
    respostaTimestamp: timestampColuna(cabecalho, linha, "Carimbo de data/hora"),
    numeroRequerimento: textoColuna(cabecalho, linha, "Número do Requerimento"),
    nomeSolicitante: textoColuna(
      cabecalho,
      linha,
      "Nome Completo do Solicitante/Representante Legal",
    ),
    cpfCnpj: textoColuna(cabecalho, linha, "CPF/CNPJ"),
    telefone: textoColuna(cabecalho, linha, "Telefone de Contato (com DDD)"),
    instituicao: textoColuna(
      cabecalho,
      linha,
      "Instituição/Entidade/Órgão Solicitante (se aplicável)",
    ),
    finalidade: textoColuna(cabecalho, linha, "Finalidade do Uso/Empréstimo do Plenário"),
    dataDesejada: dataColuna(cabecalho, linha, "Data Desejada para o Uso/Empréstimo"),
    horaInicio: horaColuna(cabecalho, linha, "Horário de Início Desejado"),
    horaFim: horaColuna(cabecalho, linha, "Horário de Término Desejado"),
    numeroParticipantes: textoColuna(cabecalho, linha, "Número Estimado de Participantes"),
    tipoEvento: textoColuna(cabecalho, linha, "Tipo de Evento"),
    equipamentos: textoColuna(cabecalho, linha, "Equipamentos de Áudio e Vídeo Desejados"),
    observacoes: textoColuna(
      cabecalho,
      linha,
      "Outros Recursos ou Observações Adicionais",
    ),
  };
}

// Lê a planilha ao vivo a cada chamada — ela é a fonte de verdade dos
// dados do pedido, nunca espelhada em tabela nossa (ver contexto do
// plano). Mapeia por nome de coluna, não por letra fixa, pra resistir a
// uma pergunta reordenada no formulário.
export async function listarSolicitacoesPlenario(): Promise<SolicitacaoPlenario[]> {
  const client = criarClienteAutenticado();
  const spreadsheetId = idDaPlanilha();
  const aba = await nomeDaPrimeiraAba(client, spreadsheetId);

  const dados = await requisitar<{ values?: unknown[][] }>(client, {
    url: `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(aba)}?valueRenderOption=UNFORMATTED_VALUE`,
    method: "GET",
  });

  const linhas = dados.values ?? [];
  if (linhas.length === 0) return [];

  const cabecalho = linhas[0].map((c) => String(c ?? "").trim());
  return linhas
    .slice(1)
    .map((linha) => paraSolicitacao(cabecalho, linha))
    // Descarta linhas sem nome de solicitante — a planilha real tinha uma
    // linha "lixo" (um link do formulário colado por engano, não uma
    // resposta de verdade); nome é obrigatório em qualquer envio genuíno.
    .filter((s) => s.nomeSolicitante.trim() !== "");
}
