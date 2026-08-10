import { JWT } from "google-auth-library";

const FUSO_BRASIL = "America/Sao_Paulo";
const ESCOPO = "https://www.googleapis.com/auth/calendar";

export type EventoAgenda = {
  id: string;
  titulo: string;
  descricao: string | null;
  local: string | null;
  inicio: string;
  fim: string;
  diaTodo: boolean;
  criadoPorUsuarioId: string | null;
  criadoPorNome: string | null;
};

export type EventoInput = {
  titulo: string;
  descricao?: string | null;
  local?: string | null;
  // Se diaTodo: "YYYY-MM-DD" (fim inclusivo do ponto de vista do usuário —
  // a conversão pro fim exclusivo que a API do Google exige acontece
  // aqui dentro). Senão: "YYYY-MM-DDTHH:mm:ss" sem timezone — o campo
  // timeZone vai explícito e separado, mesma disciplina de
  // src/lib/data-brasil.ts pra nunca depender de fuso implícito.
  inicio: string;
  fim: string;
  diaTodo: boolean;
};

type GoogleEventDateTime = { date?: string; dateTime?: string; timeZone?: string };
type GoogleEvent = {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  start: GoogleEventDateTime;
  end: GoogleEventDateTime;
  extendedProperties?: { private?: Record<string, string> };
};
type GoogleEventsListResponse = { items?: GoogleEvent[] };

function criarClienteAutenticado(): JWT {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim();
  const chaveB64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64?.trim();
  if (!email || !chaveB64) {
    throw new Error("Variáveis de ambiente da conta de serviço do Google não configuradas");
  }

  const key = Buffer.from(chaveB64, "base64").toString("utf8");
  // Colar manualmente uma string de milhares de caracteres num painel
  // web é um jeito fácil de perder um pedaço no meio ou colar quebrado
  // — sem essa checagem, o erro só aparece depois, como um "DECODER
  // routines::unsupported" do OpenSSL sem nenhuma pista de qual
  // variável está errada.
  if (!key.includes("-----BEGIN PRIVATE KEY-----")) {
    throw new Error(
      "A chave da conta de serviço do Google (GOOGLE_SERVICE_ACCOUNT_KEY_B64) parece corrompida ou incompleta — confira se o valor foi colado inteiro, sem quebras no meio.",
    );
  }

  return new JWT({ email, key, scopes: [ESCOPO] });
}

function urlEventos(id?: string): string {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) throw new Error("GOOGLE_CALENDAR_ID não configurado");
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
  return id ? `${base}/${encodeURIComponent(id)}` : base;
}

// GaxiosError (google-auth-library/gaxios) expõe o status tanto em
// err.status quanto em err.response.status dependendo da versão — checa
// os dois pra não deixar passar um 403 batizado de erro genérico.
function statusDoErro(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null) return undefined;
  const comStatus = err as { status?: number; response?: { status?: number } };
  return comStatus.status ?? comStatus.response?.status;
}

async function requisitar<T>(
  client: JWT,
  opts: { url: string; method: string; data?: unknown },
): Promise<T> {
  try {
    const res = await client.request<T>(opts);
    return res.data;
  } catch (err) {
    if (statusDoErro(err) === 403) {
      throw new Error(
        "Sem permissão de acesso à agenda do Google — verifique se o compartilhamento com a conta de serviço não foi revogado.",
      );
    }
    throw err;
  }
}

function paraEventoAgenda(ev: GoogleEvent): EventoAgenda {
  const diaTodo = Boolean(ev.start.date);
  return {
    id: ev.id,
    titulo: ev.summary ?? "(sem título)",
    descricao: ev.description ?? null,
    local: ev.location ?? null,
    inicio: diaTodo ? ev.start.date! : ev.start.dateTime!,
    // ev.end.date da API é exclusivo (dia seguinte ao último dia do
    // evento) — convertido de volta pro último dia incluído aqui, pra
    // EventoAgenda.fim sempre significar "último dia incluído" tanto na
    // leitura quanto na escrita (ver paraCorpoGoogle). Sem isso, reabrir
    // um evento de dia inteiro pra editar e salvar de novo empurraria o
    // fim um dia a mais a cada edição.
    fim: diaTodo ? diaAnterior(ev.end.date!) : ev.end.dateTime!,
    diaTodo,
    criadoPorUsuarioId: ev.extendedProperties?.private?.criadoPorUsuarioId ?? null,
    criadoPorNome: ev.extendedProperties?.private?.criadoPorNome ?? null,
  };
}

// A API do Google trata o fim de um evento de dia inteiro como exclusivo
// (o dia seguinte ao último dia do evento) — do ponto de vista de quem
// preenche o formulário, "fim" é o último dia incluído, então a conversão
// nos dois sentidos acontece aqui dentro em vez de vazar pro form/action.
function proximoDia(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia + 1)).toISOString().slice(0, 10);
}

function diaAnterior(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia - 1)).toISOString().slice(0, 10);
}

function paraCorpoGoogle(input: EventoInput) {
  return {
    summary: input.titulo,
    description: input.descricao || undefined,
    location: input.local || undefined,
    start: input.diaTodo
      ? { date: input.inicio }
      : { dateTime: input.inicio, timeZone: FUSO_BRASIL },
    end: input.diaTodo
      ? { date: proximoDia(input.fim) }
      : { dateTime: input.fim, timeZone: FUSO_BRASIL },
  };
}

export async function listarEventos({
  inicio,
  fim,
  busca,
}: {
  inicio: string;
  fim: string;
  // Repassado direto pro parâmetro "q" da API do Google — busca livre em
  // título, descrição, local e participantes.
  busca?: string;
}): Promise<EventoAgenda[]> {
  const client = criarClienteAutenticado();
  const params = new URLSearchParams({
    timeMin: inicio,
    timeMax: fim,
    // singleEvents=true expande eventos recorrentes em ocorrências
    // individuais (sem isso, um evento recorrente criado direto no
    // Google Agenda viria como um único "mestre" com regra de repetição,
    // quebrando o agrupamento por dia) — orderBy=startTime exige
    // singleEvents=true junto.
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "250",
  });
  if (busca?.trim()) params.set("q", busca.trim());
  const dados = await requisitar<GoogleEventsListResponse>(client, {
    url: `${urlEventos()}?${params.toString()}`,
    method: "GET",
  });
  return (dados.items ?? []).map(paraEventoAgenda);
}

export async function buscarEvento(id: string): Promise<EventoAgenda | null> {
  const client = criarClienteAutenticado();
  try {
    const dados = await requisitar<GoogleEvent>(client, {
      url: urlEventos(id),
      method: "GET",
    });
    // Um evento excluído não some do GET por id — a API responde 200
    // com status "cancelled" em vez de 404 (só um DELETE de verdade
    // depois disso é que passa a dar 404/410). Sem esse check, editar
    // a URL de um compromisso já excluído mostraria o formulário de
    // edição normalmente, como se ele ainda existisse.
    if (dados.status === "cancelled") return null;
    return paraEventoAgenda(dados);
  } catch (err) {
    if (statusDoErro(err) === 404) return null;
    throw err;
  }
}

export async function criarEvento(
  input: EventoInput & { criadoPorUsuarioId: string; criadoPorNome: string },
): Promise<string> {
  const client = criarClienteAutenticado();
  const dados = await requisitar<GoogleEvent>(client, {
    url: urlEventos(),
    method: "POST",
    data: {
      ...paraCorpoGoogle(input),
      extendedProperties: {
        private: {
          criadoPorUsuarioId: input.criadoPorUsuarioId,
          criadoPorNome: input.criadoPorNome,
        },
      },
    },
  });
  return dados.id;
}

export async function editarEvento(id: string, input: EventoInput): Promise<void> {
  const client = criarClienteAutenticado();
  // PATCH, não PUT — um update de objeto inteiro apagaria
  // extendedProperties.private (é onde fica a autoria do evento).
  await requisitar(client, {
    url: urlEventos(id),
    method: "PATCH",
    data: paraCorpoGoogle(input),
  });
}

export async function excluirEvento(id: string): Promise<void> {
  const client = criarClienteAutenticado();
  await requisitar(client, { url: urlEventos(id), method: "DELETE" });
}
