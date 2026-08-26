import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { escalar, paraPng } from "@/lib/docx/imagem";
import { converterHtmlParaDocx } from "@/lib/docx/html-para-docx";
import { sanitizarHtmlDocumento } from "@/lib/sanitizar-html";
import { dataPorExtenso } from "@/lib/pdf/formato";
import {
  CIDADE,
  MESA_DIRETORA,
  PREFEITO_CARGO,
  PREFEITO_NOME,
  montarCorpoAtoPadrao,
  montarCorpoDecretoPadrao,
  type ItemSuplementacao,
} from "./documento";

// 1440 twips = 1 polegada = 25,4mm.
function mm(valor: number): number {
  return Math.round((valor / 25.4) * 1440);
}

const SEM_BORDA = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

function celulaPessoa(nome: string, cargo: string, bienio?: string): TableCell {
  return new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    borders: SEM_BORDA,
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: nome.toUpperCase(), bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: cargo, bold: true })] }),
      ...(bienio ? [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: bienio })] })] : []),
    ],
  });
}

// Mesmo layout do PDF (ver ato-mesa-diretora-conteudo.tsx): Presidente
// centralizado sozinho em cima, Vice e Secretário lado a lado embaixo —
// reproduzido aqui com uma tabela sem borda de 2 colunas pro segundo par,
// mesma técnica já usada na grade de assinaturas das Moções.
//
// keepNext: true em cada parágrafo (menos o último) impede o Word de
// quebrar página NO MEIO do bloco de assinatura — sem isso, um ato que
// termina perto do fim de uma página parte o nome do Presidente numa
// página e o cargo/biênio na seguinte (visto ao vivo comparando o .docx
// gerado com o PDF equivalente).
function assinaturaMesaDiretora(): (Paragraph | Table)[] {
  return [
    new Paragraph({ spacing: { before: 400 }, keepNext: true }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      keepNext: true,
      children: [new TextRun({ text: MESA_DIRETORA.presidente.nome.toUpperCase(), bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      keepNext: true,
      children: [new TextRun({ text: MESA_DIRETORA.presidente.cargo, bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      keepNext: true,
      children: [new TextRun({ text: MESA_DIRETORA.bienio })],
    }),
    new Paragraph({ spacing: { before: 300 }, keepNext: true }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: SEM_BORDA,
      rows: [
        new TableRow({
          cantSplit: true,
          children: [
            celulaPessoa(MESA_DIRETORA.vicePresidente.nome, MESA_DIRETORA.vicePresidente.cargo, MESA_DIRETORA.bienio),
            celulaPessoa(MESA_DIRETORA.secretario.nome, MESA_DIRETORA.secretario.cargo, MESA_DIRETORA.bienio),
          ],
        }),
      ],
    }),
  ];
}

function assinaturaPrefeito(): Paragraph[] {
  return [
    new Paragraph({ spacing: { before: 400 }, keepNext: true }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      keepNext: true,
      children: [new TextRun({ text: PREFEITO_NOME.toUpperCase(), bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: PREFEITO_CARGO, bold: true })],
    }),
  ];
}

async function logoParagrafo(logoBuffer: Buffer): Promise<Paragraph> {
  const { data, width, height } = await paraPng(logoBuffer);
  const dimensoes = escalar(width, height, 90, 90);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new ImageRun({ data, transformation: dimensoes, type: "png" })],
  });
}

function documentoPadrao(blocos: (Paragraph | Table)[]): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: mm(210), height: mm(297) },
            margin: { top: mm(30), bottom: mm(20), left: mm(30), right: mm(20) },
          },
        },
        children: blocos,
      },
    ],
  });
  return Packer.toBuffer(doc);
}

// Gera o Ato em .docx, editável no Word — mesmo texto do PDF (ver
// ato-mesa-diretora-conteudo.tsx), mas sem o timbrado fotográfico de
// fundo (só a logo no topo) — igual à mesma decisão já tomada pras Moções
// (ver gerar-docx.ts): um fundo de página inteira não é um recurso nativo
// do Word, e o objetivo aqui é ter uma versão editável, não uma réplica
// pixel a pixel do PDF. O título já vem dentro do corpo_ato_html (ou do
// texto padrão), não precisa de um cabeçalho de título à parte.
export async function gerarDocxAto({
  dataAto,
  corpoHtml,
  itensDestino,
  itensOrigem,
  logoBuffer,
}: {
  dataAto: string;
  corpoHtml: string | null;
  itensDestino: ItemSuplementacao[];
  itensOrigem: ItemSuplementacao[];
  logoBuffer: Buffer;
}): Promise<Buffer> {
  const html = sanitizarHtmlDocumento(
    corpoHtml?.trim() || montarCorpoAtoPadrao({ dataAto, itensDestino, itensOrigem }),
  );

  const fechamento = new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { before: 300 },
    children: [new TextRun({ text: `${CIDADE}, ${dataPorExtenso(dataAto)}.` })],
  });

  return documentoPadrao([
    await logoParagrafo(logoBuffer),
    ...converterHtmlParaDocx(html),
    fechamento,
    ...assinaturaMesaDiretora(),
  ]);
}

// Mesma lógica do Ato, com o fechamento e a assinatura do Decreto
// (Gabinete do Prefeito / Prefeito Municipal — ver decreto-suplementacao-
// conteudo.tsx).
export async function gerarDocxDecreto({
  numeroDecreto,
  dataDecreto,
  corpoHtml,
  itensDestino,
  itensOrigem,
  logoBuffer,
}: {
  numeroDecreto: string;
  dataDecreto: string;
  corpoHtml: string | null;
  itensDestino: ItemSuplementacao[];
  itensOrigem: ItemSuplementacao[];
  logoBuffer: Buffer;
}): Promise<Buffer> {
  const html = sanitizarHtmlDocumento(
    corpoHtml?.trim() ||
      montarCorpoDecretoPadrao({ numeroDecreto, dataDecreto, itensDestino, itensOrigem }),
  );

  const fechamento = new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { before: 300 },
    children: [new TextRun({ text: `Gabinete do Prefeito de ${CIDADE}, ${dataPorExtenso(dataDecreto)}.` })],
  });

  return documentoPadrao([
    await logoParagrafo(logoBuffer),
    ...converterHtmlParaDocx(html),
    fechamento,
    ...assinaturaPrefeito(),
  ]);
}
