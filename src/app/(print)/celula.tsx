export const headerCell = "bg-[#CDF3F3] text-center font-semibold";

// Cada célula desenha só a borda direita/inferior — a borda de cima e da
// esquerda da tabela inteira vem do wrapper (TabelaGrid). Isso evita que
// bordas de células vizinhas se sobreponham e pareçam mais grossas
// (efeito "negrito") nas linhas internas. Todas as bordas (aqui e no
// TabelaGrid) usam a mesma espessura (1.5px) pra não ficar linha grossa
// misturada com linha fina — 1px demonstrou sumir por arredondamento de
// sub-pixel na rasterização do PDF em algumas linhas, mesmo com o
// deviceScaleFactor alto (ver gerar-pdf.ts); 1.5px (3 pixels físicos com
// deviceScaleFactor 2) dá margem suficiente sem ficar tão grosso quanto 2px.
export function Celula({
  span,
  className = "",
  children,
}: {
  span: number;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`border-r-[1.5px] border-b-[1.5px] border-black px-2 py-1 text-center ${className}`}
      style={{ gridColumn: `span ${span} / span ${span}` }}
    >
      {children}
    </div>
  );
}

export function TabelaGrid({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`grid grid-cols-12 border-t-[1.5px] border-l-[1.5px] border-black ${className}`}
    >
      {children}
    </div>
  );
}

export function PaginaA4({
  children,
  quebrarPagina = true,
}: {
  children: React.ReactNode;
  quebrarPagina?: boolean;
}) {
  return (
    <div
      data-print-pagina
      className={`mx-auto flex h-[297mm] w-[210mm] flex-col bg-white bg-cover bg-no-repeat text-[9pt] text-black shadow-lg print:shadow-none ${
        quebrarPagina ? "print:break-after-page" : ""
      }`}
      style={{ backgroundImage: "url(/timbrado/pagina-a4.jpg)" }}
    >
      {children}
    </div>
  );
}
