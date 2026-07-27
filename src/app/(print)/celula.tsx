export const headerCell = "bg-[#CDF3F3] text-center font-semibold";

// Cada célula desenha só a borda direita/inferior — a borda de cima e da
// esquerda da tabela inteira vem do wrapper (TabelaGrid). Isso evita que
// bordas de células vizinhas se sobreponham e pareçam mais grossas
// (efeito "negrito") nas linhas internas.
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
      className={`border-r border-b border-black px-2 py-1 text-center ${className}`}
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
  // A borda de cima/esquerda da tabela inteira não tem nenhuma célula
  // reforçando ela (ao contrário das linhas internas, cobertas por
  // border-r/border-b de várias células vizinhas), então fica mais sujeita
  // a sumir por arredondamento de sub-pixel na rasterização do PDF mesmo
  // com o deviceScaleFactor alto (ver gerar-pdf.ts). 2px em vez de 1px dá
  // margem suficiente pra nunca arredondar a zero.
  return (
    <div
      className={`grid grid-cols-12 border-t-2 border-l-2 border-black ${className}`}
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
