export const headerCell = "bg-[#CDF3F3] text-center font-semibold";

// Cada célula desenha só a borda direita/inferior — a borda de cima e da
// esquerda da tabela inteira vem do wrapper (TabelaGrid), como um "quadro"
// preenchido (padding-top/left sobre fundo preto), não uma border CSS.
//
// Já tentamos border-t/border-l em 1px, 2px e 1.5px nesse wrapper e a linha
// de cima sumia de novo em arquivos reais mesmo assim — border é desenhada
// como um traço fino (stroke) que pode cair numa posição de sub-pixel e
// ficar invisível na rasterização do PDF, não importa a espessura em CSS.
// Uma área preenchida (como as células de cabeçalho com bg-[#CDF3F3], que
// nunca tiveram esse problema) não sofre desse arredondamento, porque é
// pintada como um retângulo sólido, não como um traço. Por isso o quadro
// externo virou padding sobre fundo preto em vez de border.
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
    <div className={`bg-black pl-[1.5px] pt-[1.5px] ${className}`}>
      <div className="grid grid-cols-12 bg-white">{children}</div>
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
