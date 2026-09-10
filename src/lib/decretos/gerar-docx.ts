import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  PageBreak,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { escalar, paraPng } from "@/lib/docx/imagem";
import { dataPorExtenso } from "@/lib/pdf/formato";
import type { Tratamento } from "@/lib/supabase/database.types";
import {
  artigosTituloHonorario,
  COMISSAO_CCJ,
  COMISSAO_FINANCAS,
  NOME_CAMARA,
  SUBTITULO_TITULO_HONORARIO,
  tituloProjetoDecreto,
  type ComposicaoComissao,
} from "./documento";

// 1440 twips = 1 polegada = 25,4mm — mesma conta de suplementacoes/
// mocoes/gerar-docx.ts (cada módulo mantém a própria cópia, não vale a
// pena extrair um utilitário compartilhado por 3 usos pequenos e
// independentes).
function mm(valor: number): number {
  return Math.round((valor / 25.4) * 1440);
}

// px a 96dpi — o que o docx-js espera em ImageRun.transformation.
function mmParaPx(valor: number): number {
  return Math.round((valor / 25.4) * 96);
}

const BORDA_CAIXA = {
  top: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  left: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
  right: { style: BorderStyle.SINGLE, size: 4, color: "000000" },
};

type Decreto = {
  numero: string;
  data_decreto: string;
  tratamento: Tratamento;
  nome_homenageado: string;
  autor_nome: string;
  autor_partido: string | null;
  dotacao_orcamentaria: string;
  justificativa: string;
};

async function logoParagrafo(logoBuffer: Buffer): Promise<Paragraph> {
  const { data, width, height } = await paraPng(logoBuffer);
  const dimensoes = escalar(width, height, 90, 90);
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new ImageRun({ data, transformation: dimensoes, type: "png" })],
  });
}

// Igual a ArtigoFormatado em decreto-conteudo.tsx: negrito no prefixo
// "Art. N° –" e, dentro do texto, no nome do homenageado onde ele
// aparecer (só o Art. 1º tem o nome, mas a função não presume isso).
function paragrafoArtigo(texto: string, nomeHomenageado: string): Paragraph {
  const match = texto.match(/^(Art\.\s*\d+°\s*–\s*)([\s\S]*)$/);
  if (!match) {
    return new Paragraph({ alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: texto })] });
  }
  const [, prefixo, resto] = match;
  const partes = resto.split(nomeHomenageado);

  const runs: TextRun[] = [new TextRun({ text: prefixo, bold: true })];
  partes.forEach((parte, i) => {
    if (parte) runs.push(new TextRun({ text: parte }));
    if (i < partes.length - 1) runs.push(new TextRun({ text: nomeHomenageado, bold: true }));
  });

  return new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 120 }, children: runs });
}

function assinaturaAutor(decreto: Decreto): Paragraph[] {
  return [
    new Paragraph({ spacing: { before: 400 }, keepNext: true }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      keepNext: true,
      children: [new TextRun({ text: decreto.autor_nome, bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Vereador(a)${decreto.autor_partido ? ` – ${decreto.autor_partido}` : ""}`,
        }),
      ],
    }),
  ];
}

function fechamento(dataDecreto: string): Paragraph {
  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    spacing: { before: 300 },
    children: [new TextRun({ text: `${NOME_CAMARA}, ${dataPorExtenso(dataDecreto)}.` })],
  });
}

// Caixa do parecer de comissão (título + linha de assinatura em branco +
// nomes dos membros) — reproduzida como uma tabela de 1 célula com borda,
// já que um "box" com borda ao redor de vários parágrafos não é algo que
// dê pra fazer só com Paragraph no Word (border em Paragraph desenha uma
// borda por parágrafo, não uma caixa única ao redor do bloco inteiro).
function caixaParecer(comissao: ComposicaoComissao): Table {
  const linhas: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: comissao.titulo.toUpperCase(), bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 300 },
      children: [new TextRun({ text: "_______________ / _______________ / _______________", color: "666666" })],
    }),
  ];
  comissao.membros.forEach((membro, i) => {
    linhas.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: i === 0 ? 400 : 300 },
        children: [new TextRun({ text: membro, bold: true })],
      }),
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: BORDA_CAIXA,
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
            children: linhas,
          }),
        ],
      }),
    ],
  });
}

async function fotoParagrafo(fotoBuffer: Buffer): Promise<Paragraph> {
  const { data, width, height } = await paraPng(fotoBuffer);
  // 80mm x 120mm igual ao PDF (h-[120mm] w-[80mm] em decreto-conteudo.tsx).
  const dimensoes = escalar(width, height, mmParaPx(80), mmParaPx(120));
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 200 },
    children: [new ImageRun({ data, transformation: dimensoes, type: "png" })],
  });
}

// Gera o Projeto de Decreto Legislativo (Título de Cidadão Honorário) em
// .docx, editável no Word — mesmo texto/estrutura do PDF (ver decreto-
// conteudo.tsx): capa do projeto, pareceres de CCJ/Finanças e
// justificativa (com foto, se houver), cada bloco numa página própria.
// Sem o timbrado fotográfico de fundo (só a logo no topo) — mesma
// decisão já tomada em suplementacoes/gerar-docx.ts e mocoes/gerar-
// docx.ts: fundo de página inteira não é um recurso nativo do Word.
export async function gerarDocxDecretoTituloHonorario({
  decreto,
  logoBuffer,
  fotoBuffer,
}: {
  decreto: Decreto;
  logoBuffer: Buffer;
  fotoBuffer: Buffer | null;
}): Promise<Buffer> {
  const artigos = artigosTituloHonorario({
    tratamento: decreto.tratamento,
    nomeHomenageado: decreto.nome_homenageado,
    dotacaoOrcamentaria: decreto.dotacao_orcamentaria,
  });

  const paragrafosJustificativa = decreto.justificativa
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const blocos: (Paragraph | Table)[] = [
    await logoParagrafo(logoBuffer),

    // Página 1 — capa do projeto.
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: tituloProjetoDecreto({ numero: decreto.numero, dataDecreto: decreto.data_decreto }), bold: true }),
      ],
    }),
    new Paragraph({
      indent: { left: mm(80) },
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 100 },
      children: [new TextRun({ text: SUBTITULO_TITULO_HONORARIO, bold: true })],
    }),
    new Paragraph({
      indent: { firstLine: mm(12.5) },
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 400 },
      children: [
        new TextRun({
          text: `A ${NOME_CAMARA} de Minas Gerais, aprova e eu, promulgo o seguinte Decreto Legislativo:`,
        }),
      ],
    }),
    ...artigos.map((artigo) => paragrafoArtigo(artigo, decreto.nome_homenageado)),
    fechamento(decreto.data_decreto),
    ...assinaturaAutor(decreto),

    // Página 2 — pareceres de comissão.
    new Paragraph({ children: [new PageBreak()] }),
    caixaParecer(COMISSAO_CCJ),
    new Paragraph({ spacing: { before: 600 } }),
    caixaParecer(COMISSAO_FINANCAS),

    // Página(s) 3+ — justificativa.
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: "JUSTIFICATIVA", bold: true })],
    }),
  ];

  if (fotoBuffer) blocos.push(await fotoParagrafo(fotoBuffer));

  paragrafosJustificativa.forEach((paragrafo) => {
    blocos.push(
      new Paragraph({
        indent: { firstLine: mm(12.5) },
        alignment: AlignmentType.JUSTIFIED,
        spacing: { before: 120 },
        children: [new TextRun({ text: paragrafo })],
      }),
    );
  });

  blocos.push(fechamento(decreto.data_decreto), ...assinaturaAutor(decreto));

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
