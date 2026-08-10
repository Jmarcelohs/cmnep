import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { launchBrowser } from "@/lib/pdf/launch-browser";

export function slugify(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Monta o cabeçalho Content-Disposition com acentos/espaços/caracteres
// especiais no nome do arquivo baixado (ex.: "Solicitação de Diária...pdf").
// Só "filename=" com UTF-8 cru não é garantido em todo cliente HTTP, então
// manda os dois: um nome ASCII seguro como fallback (filename=) e o nome
// de verdade, codificado conforme RFC 5987 (filename*=), que os
// navegadores atuais usam preferencialmente.
export function cabecalhoContentDisposition(filename: string): string {
  const semExtensao = filename.replace(/\.pdf$/i, "");
  const fallbackAscii = `${slugify(semExtensao)}.pdf`;
  const utf8 = encodeURIComponent(filename);
  return `attachment; filename="${fallbackAscii}"; filename*=UTF-8''${utf8}`;
}

export async function renderizarPdfDaRota(
  request: NextRequest,
  caminhoInterno: string,
  // Só a Moção de Congratulação usa página A4 deitada hoje (timbrado real
  // é paisagem — ver mocao-conteudo.tsx). Sem isso, page.pdf() gera uma
  // página A4 retrato e encolhe o conteúdo de 297mm de largura pra caber
  // nos 210mm — o PDF parece certo na tela (proporção preservada), mas
  // sai menor e na orientação errada quando impresso de verdade.
  paisagem = false,
): Promise<Buffer> {
  const cookies = request.cookies.getAll();
  const origin = request.nextUrl.origin;

  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();

    // deviceScaleFactor 1 (padrão) faz o Chromium arredondar bordas finas
    // (1px) pra posições de sub-pixel na hora de rasterizar o PDF, e elas
    // somem ou ficam apagadas. Em 2, a mesma borda de 1px vira 2 pixels
    // físicos e renderiza nítida — sem precisar engrossar a borda no CSS.
    await page.setViewport({
      width: paisagem ? 1754 : 1240,
      height: paisagem ? 1240 : 1754,
      deviceScaleFactor: 2,
    });

    await page.setCookie(
      ...cookies.map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
        domain: request.nextUrl.hostname,
        path: "/",
      })),
    );

    const response = await page.goto(`${origin}${caminhoInterno}`, {
      waitUntil: "networkidle0",
    });

    if (!response || response.status() >= 400) {
      throw new Error("Não foi possível renderizar o documento");
    }

    return Buffer.from(
      await page.pdf({
        format: "A4",
        landscape: paisagem,
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      }),
    );
  } finally {
    await browser.close();
  }
}

// Mescla PDFs extras (ex.: comprovantes em PDF anexados a um requerimento)
// ao final de um documento já gerado.
export async function anexarPdfsAoFinal(
  pdfBase: Buffer,
  pdfsParaAnexar: Buffer[],
): Promise<Buffer> {
  if (pdfsParaAnexar.length === 0) return pdfBase;

  const documentoFinal = await PDFDocument.load(pdfBase);
  for (const anexo of pdfsParaAnexar) {
    try {
      const documentoAnexo = await PDFDocument.load(anexo);
      const paginas = await documentoFinal.copyPages(
        documentoAnexo,
        documentoAnexo.getPageIndices(),
      );
      paginas.forEach((paginaAnexo) => documentoFinal.addPage(paginaAnexo));
    } catch (err) {
      // Um PDF anexado corrompido/inválido não pode derrubar a geração
      // do documento inteiro — só deixa de entrar nesse caso.
      console.error("Falha ao mesclar comprovante em PDF:", err);
    }
  }
  return Buffer.from(await documentoFinal.save());
}

// Reconstrói um PDF intercalando, logo depois de páginas específicas
// (índice 0-based da última página da seção), as páginas de outros PDFs —
// usado pra colocar os comprovantes em PDF de cada requerimento logo após
// a seção dele no PDF combinado, em vez de jogar tudo no final do arquivo.
export async function intercalarPdfs(
  pdfBase: Buffer,
  insercoes: { aposPagina: number; pdfs: Buffer[] }[],
): Promise<Buffer> {
  const comInsercoes = insercoes.filter((i) => i.pdfs.length > 0);
  if (comInsercoes.length === 0) return pdfBase;

  const base = await PDFDocument.load(pdfBase);
  const totalPaginasBase = base.getPageCount();
  const documentoFinal = await PDFDocument.create();
  const mapaInsercoes = new Map(comInsercoes.map((i) => [i.aposPagina, i.pdfs]));

  for (let i = 0; i < totalPaginasBase; i++) {
    const [pagina] = await documentoFinal.copyPages(base, [i]);
    documentoFinal.addPage(pagina);

    const pdfsParaInserir = mapaInsercoes.get(i);
    if (pdfsParaInserir) {
      for (const pdfExtra of pdfsParaInserir) {
        try {
          const anexo = await PDFDocument.load(pdfExtra);
          const paginasAnexo = await documentoFinal.copyPages(anexo, anexo.getPageIndices());
          paginasAnexo.forEach((p) => documentoFinal.addPage(p));
        } catch (err) {
          // PDF corrompido/inválido — ignora, não derruba o documento inteiro.
          console.error("Falha ao intercalar comprovante em PDF:", err);
        }
      }
    }
  }

  return Buffer.from(await documentoFinal.save());
}

export async function gerarPdfDeRota(
  request: NextRequest,
  caminhoInterno: string,
  filename: string,
  // PDFs de comprovantes anexados — entram como páginas extras, ao final
  // do documento gerado (ex.: recibos em PDF anexados a um requerimento).
  pdfsParaAnexar: Buffer[] = [],
  paisagem = false,
) {
  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await renderizarPdfDaRota(request, caminhoInterno, paisagem);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível renderizar o documento" },
      { status: 502 },
    );
  }

  pdfBuffer = await anexarPdfsAoFinal(pdfBuffer, pdfsParaAnexar);

  return new NextResponse(Buffer.from(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": cabecalhoContentDisposition(filename),
    },
  });
}
