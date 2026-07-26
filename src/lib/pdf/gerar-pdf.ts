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

export async function gerarPdfDeRota(
  request: NextRequest,
  caminhoInterno: string,
  filename: string,
  // PDFs de comprovantes anexados — entram como páginas extras, ao final
  // do documento gerado (ex.: recibos em PDF anexados a um requerimento).
  pdfsParaAnexar: Buffer[] = [],
) {
  const cookies = request.cookies.getAll();
  const origin = request.nextUrl.origin;

  const browser = await launchBrowser();

  try {
    const page = await browser.newPage();

    // deviceScaleFactor 1 (padrão) faz o Chromium arredondar bordas finas
    // (1px) pra posições de sub-pixel na hora de rasterizar o PDF, e elas
    // somem ou ficam apagadas. Em 2, a mesma borda de 1px vira 2 pixels
    // físicos e renderiza nítida — sem precisar engrossar a borda no CSS.
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 2 });

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
      return NextResponse.json(
        { error: "Não foi possível renderizar o documento" },
        { status: 502 },
      );
    }

    let pdfBuffer = Buffer.from(
      await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "0", right: "0", bottom: "0", left: "0" },
      }),
    );

    if (pdfsParaAnexar.length > 0) {
      const documentoFinal = await PDFDocument.load(pdfBuffer);
      for (const anexo of pdfsParaAnexar) {
        try {
          const documentoAnexo = await PDFDocument.load(anexo);
          const paginas = await documentoFinal.copyPages(
            documentoAnexo,
            documentoAnexo.getPageIndices(),
          );
          paginas.forEach((paginaAnexo) => documentoFinal.addPage(paginaAnexo));
        } catch {
          // Um PDF anexado corrompido/inválido não pode derrubar a geração
          // do documento inteiro — só deixa de entrar nesse caso.
        }
      }
      pdfBuffer = Buffer.from(await documentoFinal.save());
    }

    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } finally {
    await browser.close();
  }
}
