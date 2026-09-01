import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { formatarData, formatarMoeda, dataPorExtenso } from "@/lib/pdf/formato";
import { hojeBrasil, agoraBrasilFormatado } from "@/lib/data-brasil";
import { PrintButton } from "../../../print-button";
import { PaginaA4 } from "../../../celula";
import type { Database } from "@/lib/supabase/database.types";

type LinhaLoa = Database["public"]["Tables"]["loa_projecoes"]["Row"];

function codigoCompleto(l: LinhaLoa): string {
  return `${l.orgao_codigo}.${l.unidade_codigo}.${l.subfuncao_codigo}.${l.programa_codigo}.${l.projeto_atividade_codigo}.${l.elemento_codigo}.${l.fonte_codigo}`;
}

function formatarAtividade(codigo: string): string {
  return codigo.length > 1 ? `${codigo.slice(0, 1)}.${codigo.slice(1)}` : codigo;
}

type Grupo = { codigo: string; nome: string; itens: LinhaLoa[]; subtotal: number };

function agruparPorAtividade(linhas: LinhaLoa[]): Grupo[] {
  const grupos = new Map<string, Grupo>();
  for (const linha of linhas) {
    const grupo = grupos.get(linha.projeto_atividade_codigo) ?? {
      codigo: linha.projeto_atividade_codigo,
      nome: linha.projeto_atividade_nome,
      itens: [],
      subtotal: 0,
    };
    grupo.itens.push(linha);
    grupo.subtotal += linha.valor_projetado;
    grupos.set(linha.projeto_atividade_codigo, grupo);
  }
  return Array.from(grupos.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
}

// Linhas "achatadas" pra paginar — cabeçalho de grupo e itens viram o
// mesmo tipo de unidade (com uma altura estimada em mm cada), pra dar pra
// distribuir em páginas A4 paisagem sem cortar uma linha ao meio. O número
// sequencial do item (equivalente ao "Nº" da ficha no relatório do Betha)
// é atribuído aqui, na ordem de impressão — dotações novas (sem ficha de
// origem) simplesmente continuam a contagem, já que não têm um número de
// ficha real pra mostrar.
type LinhaAchatada =
  | { tipo: "grupo"; grupo: Grupo; continuacao: boolean; alturaMm: number }
  | { tipo: "item"; item: LinhaLoa; grupo: Grupo; numero: number; alturaMm: number };

const ALTURA_GRUPO_MM = 6.5;
const ALTURA_ITEM_MM = 5.2;
const ALTURA_CONTEUDO_MM = 118;
const RESERVA_CABECALHO_PAGINA_MM = 16 + 6; // bloco institucional + cabeçalho "Especificações/Valor"
const RESERVA_CONTEXTO_MM = 17; // bloco Órgão/Unidade/Subfunção/Programa, só na página 1
const RESERVA_FECHAMENTO_MM = 16; // "Total Geral" + assinatura, só na última página

type Pagina = { linhas: LinhaAchatada[]; comContexto: boolean; comFechamento: boolean };

function montarPaginas(grupos: Grupo[]): Pagina[] {
  const achatadas: LinhaAchatada[] = [];
  let numero = 1;
  for (const grupo of grupos) {
    achatadas.push({ tipo: "grupo", grupo, continuacao: false, alturaMm: ALTURA_GRUPO_MM });
    for (const item of grupo.itens) {
      achatadas.push({ tipo: "item", item, grupo, numero: numero++, alturaMm: ALTURA_ITEM_MM });
    }
  }

  const paginas: Pagina[] = [];
  let atual: LinhaAchatada[] = [];
  let alturaUsada = 0;
  let ehPrimeiraPagina = true;

  function orcamentoAtual() {
    return ALTURA_CONTEUDO_MM - RESERVA_CABECALHO_PAGINA_MM - (ehPrimeiraPagina ? RESERVA_CONTEXTO_MM : 0);
  }

  function fecharPagina() {
    if (atual.length > 0) paginas.push({ linhas: atual, comContexto: ehPrimeiraPagina, comFechamento: false });
    atual = [];
    alturaUsada = 0;
    ehPrimeiraPagina = false;
  }

  for (let i = 0; i < achatadas.length; i++) {
    const linha = achatadas[i];
    if (alturaUsada + linha.alturaMm > orcamentoAtual() && atual.length > 0) {
      fecharPagina();
      // Uma página nova que começa no meio de um grupo (a primeira linha
      // dela é um item, não o cabeçalho do grupo) reimprime o cabeçalho
      // desse grupo marcado como continuação — mesma convenção do
      // relatório de referência, que reimprime o cabeçalho do nível
      // quando ele muda de página no meio de uma listagem.
      if (linha.tipo === "item") {
        atual.push({ tipo: "grupo", grupo: linha.grupo, continuacao: true, alturaMm: ALTURA_GRUPO_MM });
        alturaUsada += ALTURA_GRUPO_MM;
      }
    }
    atual.push(linha);
    alturaUsada += linha.alturaMm;
  }
  if (atual.length > 0) paginas.push({ linhas: atual, comContexto: ehPrimeiraPagina, comFechamento: false });

  if (paginas.length === 0) {
    return [{ linhas: [], comContexto: true, comFechamento: true }];
  }

  const ultima = paginas[paginas.length - 1];
  const alturaUltima = ultima.linhas.reduce((soma, l) => soma + l.alturaMm, 0);
  const orcamentoUltima =
    ALTURA_CONTEUDO_MM - RESERVA_CABECALHO_PAGINA_MM - (ultima.comContexto ? RESERVA_CONTEXTO_MM : 0);

  if (alturaUltima + RESERVA_FECHAMENTO_MM <= orcamentoUltima) {
    ultima.comFechamento = true;
  } else {
    paginas.push({ linhas: [], comContexto: false, comFechamento: true });
  }

  return paginas;
}

function CabecalhoInstitucional({
  pagina,
  totalPaginas,
  geradoEm,
}: {
  pagina: number;
  totalPaginas: number;
  geradoEm: string;
}) {
  return (
    <div className="flex items-start justify-between border-b-2 border-black pb-1 text-[8.5pt]">
      <div>
        <p className="text-[11pt] font-bold leading-tight">Proposta Orçamentária — LOA 2027</p>
        <p className="leading-tight">ENTIDADE: CÂMARA MUNICIPAL DE NEPOMUCENO</p>
      </div>
      <div className="text-right leading-tight">
        <p>
          Página: {pagina} / {totalPaginas}
        </p>
        <p>Data de emissão: {geradoEm}</p>
        <p>Exercício de 2027</p>
        <p>Despesa: Projetada</p>
      </div>
    </div>
  );
}

function CabecalhoTabela() {
  return (
    <div className="mt-2 flex justify-between border-b border-black bg-[#e5e5e5] px-1 py-0.5 text-[8.5pt] font-semibold">
      <p>ESPECIFICAÇÕES</p>
      <p>PROJETADO</p>
    </div>
  );
}

function BlocoContexto({ linha }: { linha: LinhaLoa }) {
  return (
    <div className="mt-1 space-y-0.5 text-[8.5pt]">
      <p className="font-bold">
        {linha.orgao_codigo} - {linha.orgao_nome}
      </p>
      <p className="pl-3 font-bold">
        {linha.orgao_codigo}.{linha.unidade_codigo} - {linha.unidade_nome}
      </p>
      <p className="pl-6">
        {linha.orgao_codigo}.{linha.unidade_codigo}.{linha.subfuncao_codigo} - {linha.subfuncao_nome}
      </p>
      <p className="pl-6">
        {linha.orgao_codigo}.{linha.unidade_codigo}.{linha.subfuncao_codigo}.{linha.programa_codigo} -{" "}
        {linha.programa_nome}
      </p>
    </div>
  );
}

export default async function ImprimirLoaPage() {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") notFound();

  const supabase = await createClient();
  const { data: linhas } = await supabase
    .from("loa_projecoes")
    .select("*")
    .eq("ano", 2027)
    .order("orgao_codigo")
    .order("unidade_codigo")
    .order("projeto_atividade_codigo")
    .order("elemento_codigo");

  const todasLinhas = linhas ?? [];
  const grupos = agruparPorAtividade(todasLinhas);
  const total = todasLinhas.reduce((soma, l) => soma + l.valor_projetado, 0);
  const geradoEmData = formatarData(hojeBrasil());
  const geradoEmCompleto = agoraBrasilFormatado();

  const paginas = montarPaginas(grupos);
  const totalPaginas = paginas.length;

  return (
    <>
      <PrintButton url="/api/provisionamento/loa/pdf" nomeArquivoPadrao="proposta-loa-2027.pdf" />
      {paginas.map((pagina, indice) => (
        <PaginaA4
          key={indice}
          orientacao="paisagem"
          backgroundImage="/timbrado/pagina-a4-loa-paisagem.jpg"
          quebrarPagina={indice < paginas.length - 1}
        >
          <div
            className="ml-[12mm] mr-[12mm] mt-[46mm] mb-[46mm] flex flex-col font-sans"
            style={{ height: "118mm" }}
          >
            <CabecalhoInstitucional pagina={indice + 1} totalPaginas={totalPaginas} geradoEm={geradoEmData} />
            <CabecalhoTabela />

            {pagina.comContexto && todasLinhas.length > 0 && <BlocoContexto linha={todasLinhas[0]} />}

            {pagina.linhas.map((linha, i) =>
              linha.tipo === "grupo" ? (
                <div
                  key={`grupo-${indice}-${i}`}
                  className="mt-1 flex justify-between border-b border-black bg-slate-100 px-1 py-0.5 text-[9pt] font-bold"
                >
                  <p>
                    {formatarAtividade(linha.grupo.codigo)} - {linha.grupo.nome}
                    {linha.continuacao && <span className="font-normal italic"> (continuação)</span>}
                  </p>
                  <p>{formatarMoeda(linha.grupo.subtotal)}</p>
                </div>
              ) : (
                <div
                  key={linha.item.id}
                  className="flex items-baseline border-b border-slate-200 px-1 py-0.5 text-[8pt]"
                >
                  <p className="w-[7mm] shrink-0 text-right text-slate-500">{linha.numero}</p>
                  <p className="w-[52mm] shrink-0 whitespace-nowrap pl-1 font-mono text-[7pt] text-slate-500">
                    {codigoCompleto(linha.item)}
                  </p>
                  <p className="flex-1 truncate pr-2">{linha.item.elemento_nome}</p>
                  <p className="w-[42mm] shrink-0 truncate pr-2 text-slate-600">{linha.item.fonte_nome}</p>
                  <p className="w-[26mm] shrink-0 text-right">{formatarMoeda(linha.item.valor_projetado)}</p>
                </div>
              ),
            )}

            {pagina.comFechamento && (
              <div className="mt-2">
                <div className="flex justify-between border-t-2 border-black pt-1 text-[10pt] font-bold">
                  <p>Total Geral</p>
                  <p>{formatarMoeda(total)}</p>
                </div>
                <p className="mt-3 text-[8.5pt]">Nepomuceno, {dataPorExtenso(hojeBrasil())}.</p>
              </div>
            )}

            <p className="mt-auto text-[7pt] text-slate-500">
              Sistema de Gestão — Câmara Municipal de Nepomuceno. Usuário: {usuario.nome}. Emissão:{" "}
              {geradoEmCompleto}. Ferramenta de planejamento interno — não substitui o rascunho oficial da LOA.
            </p>
          </div>
        </PaginaA4>
      ))}
    </>
  );
}
