import fs from "fs";
import path from "path";
import sharp from "sharp";
import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  PageOrientation,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";
import {
  aberturaCongratulacaoSegmentos,
  aberturaPesarSegmentos,
  enderecamentoPesarSegmentos,
  fechoMocao,
  legendaAssinatura,
  ordenarSignatarios,
  PARAGRAFOS_PESAR_FIXOS,
  type SegmentoMocao,
  type VereadorSignatario,
} from "./documento";
import type { TipoMocao, Tratamento } from "@/lib/supabase/database.types";

export type MocaoParaDocx = {
  tipo: TipoMocao;
  data_mocao: string;
  destinatario: string;
  destinatario_tratamento: Tratamento | null;
  justificativa: string;
};

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

function segmentosParaRuns(segmentos: SegmentoMocao[], size: number): TextRun[] {
  return segmentos.map((s) => new TextRun({ text: s.texto, bold: s.negrito, size }));
}

// docx-js exige um Buffer + tipo explícito de imagem — normaliza pra PNG
// via sharp independente do formato de origem (as assinaturas aceitam
// jpeg/png/webp no cadastro, ver /vereadores), evitando ter que detectar
// o formato real de cada arquivo.
async function paraPng(origem: Buffer): Promise<{ data: Buffer; width: number; height: number }> {
  const data = await sharp(origem).png().toBuffer();
  const meta = await sharp(data).metadata();
  return { data, width: meta.width ?? 1, height: meta.height ?? 1 };
}

async function bufferDeUrl(url: string): Promise<Buffer> {
  const resposta = await fetch(url);
  return Buffer.from(await resposta.arrayBuffer());
}

function escalar(
  largura: number,
  altura: number,
  larguraAlvo: number,
  alturaMax: number,
): { width: number; height: number } {
  let w = larguraAlvo;
  let h = (altura / largura) * w;
  if (h > alturaMax) {
    h = alturaMax;
    w = (largura / altura) * h;
  }
  return { width: Math.round(w), height: Math.round(h) };
}

async function celulaAssinatura(
  signatario: VereadorSignatario,
  assinaturaUrl: string | null,
): Promise<TableCell> {
  const paragrafos: Paragraph[] = [];

  if (assinaturaUrl) {
    try {
      const bruto = await bufferDeUrl(assinaturaUrl);
      const { data, width, height } = await paraPng(bruto);
      const dimensoes = escalar(width, height, 140, 55);
      paragrafos.push(
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new ImageRun({ data, transformation: dimensoes, type: "png" })],
        }),
      );
    } catch {
      // Assinatura não pôde ser baixada (URL expirada, storage fora do
      // ar) — segue sem a imagem, só com a linha e o nome, igual ao
      // caso de vereador sem assinatura cadastrada.
      paragrafos.push(new Paragraph({ spacing: { before: 200 }, children: [] }));
    }
  } else {
    paragrafos.push(new Paragraph({ spacing: { before: 200 }, children: [] }));
  }

  paragrafos.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40 },
      border: { top: { style: BorderStyle.SINGLE, size: 4, color: "000000" } },
      children: [new TextRun({ text: signatario.nome, size: 20 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: legendaAssinatura(signatario), size: 14 })],
    }),
  );

  return new TableCell({
    width: { size: 33, type: WidthType.PERCENTAGE },
    borders: SEM_BORDA,
    verticalAlign: VerticalAlign.BOTTOM,
    children: paragrafos,
  });
}

function celulaVazia(): TableCell {
  return new TableCell({
    width: { size: 33, type: WidthType.PERCENTAGE },
    borders: SEM_BORDA,
    children: [new Paragraph({ children: [] })],
  });
}

async function gradeAssinaturas(
  signatarios: VereadorSignatario[],
  assinaturasPorId: Record<string, string | null>,
): Promise<Table> {
  const linhas: TableRow[] = [];
  for (let i = 0; i < signatarios.length; i += 3) {
    const grupo = signatarios.slice(i, i + 3);
    const celulas = await Promise.all(
      grupo.map((s) => celulaAssinatura(s, assinaturasPorId[s.id] ?? null)),
    );
    while (celulas.length < 3) celulas.push(celulaVazia());
    linhas.push(new TableRow({ children: celulas }));
  }
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: linhas, borders: SEM_BORDA });
}

// Gera a moção em .docx, editável no Word — mesmo conteúdo textual e
// ordem de assinaturas do PDF (ver mocao-conteudo.tsx), mas sem o
// timbrado fotográfico de fundo: um fundo em foto de página inteira não
// é um recurso nativo do Word (só cabeçalho/rodapé com imagem), e o
// objetivo aqui é ter uma versão editável, não uma réplica pixel a
// pixel do PDF.
export async function gerarDocxMocao({
  mocao,
  autor,
  associados,
  assinaturasPorId,
}: {
  mocao: MocaoParaDocx;
  autor: VereadorSignatario;
  associados: VereadorSignatario[];
  assinaturasPorId: Record<string, string | null>;
}): Promise<Buffer> {
  const signatarios = ordenarSignatarios([autor, ...associados]);
  const associadosNomes = associados.map((v) => v.nome);
  const paisagem = mocao.tipo !== "pesar";

  const logoPath = path.join(process.cwd(), "public", "timbrado", "logo.png");
  const { data: logoData, width: logoW, height: logoH } = await paraPng(fs.readFileSync(logoPath));
  const logoDim = escalar(logoW, logoH, 100, 100);

  const titulo = mocao.tipo === "pesar" ? "MOÇÃO DE PESAR" : "MOÇÃO DE CONGRATULAÇÃO";

  const cabecalho = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new ImageRun({ data: logoData, transformation: logoDim, type: "png" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 320 },
      children: [new TextRun({ text: titulo, bold: true, size: 32, color: "1F4E3D" })],
    }),
  ];

  const corpo: Paragraph[] = [];

  if (mocao.tipo === "pesar") {
    const tratamento = mocao.destinatario_tratamento ?? "Sr.";
    corpo.push(
      new Paragraph({
        spacing: { after: 200 },
        children: segmentosParaRuns(
          enderecamentoPesarSegmentos({
            destinatarioNome: mocao.destinatario,
            destinatarioTratamento: tratamento,
          }),
          24,
        ),
      }),
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 200 },
        children: segmentosParaRuns(
          aberturaPesarSegmentos({
            autorNome: autor.nome,
            autorGenero: autor.genero,
            associadosNomes,
            destinatarioNome: mocao.destinatario,
            destinatarioTratamento: tratamento,
          }),
          24,
        ),
      }),
      ...PARAGRAFOS_PESAR_FIXOS.map(
        (p) =>
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { after: 200 },
            children: [new TextRun({ text: p, size: 24 })],
          }),
      ),
      new Paragraph({
        spacing: { after: 400 },
        children: [new TextRun({ text: fechoMocao(mocao.data_mocao), size: 24 })],
      }),
    );
  } else {
    corpo.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 280 },
        children: segmentosParaRuns(
          aberturaCongratulacaoSegmentos({ autorNome: autor.nome, associadosNomes }),
          24,
        ),
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 280 },
        children: [new TextRun({ text: mocao.destinatario.toUpperCase(), bold: true, size: 72 })],
      }),
      ...mocao.justificativa
        .split(/\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
        .map(
          (p) =>
            new Paragraph({
              alignment: AlignmentType.JUSTIFIED,
              spacing: { after: 160 },
              children: [new TextRun({ text: p, size: 24 })],
            }),
        ),
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { before: 200, after: 400 },
        children: [new TextRun({ text: fechoMocao(mocao.data_mocao), size: 24 })],
      }),
    );
  }

  const grade = await gradeAssinaturas(signatarios, assinaturasPorId);

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            // Sempre as dimensões de retrato — o docx-js inverte
            // largura/altura sozinho quando a orientação é LANDSCAPE.
            size: {
              orientation: paisagem ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT,
              width: mm(210),
              height: mm(297),
            },
            margin: { top: mm(20), bottom: mm(20), left: mm(25), right: mm(25) },
          },
        },
        children: [...cabecalho, ...corpo, grade],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
