import { Celula, headerCell, PaginaA4, TabelaGrid } from "../celula";

type Foto = { url: string; nome: string };
type Documento = { nome: string };

const FOTOS_POR_PAGINA = 2;

export function ComprovantesConteudo({
  fotos,
  documentos,
  ultimoDocumento = true,
}: {
  fotos: Foto[];
  documentos: Documento[];
  // false quando há mais conteúdo depois (ex.: outros requerimentos vinculados
  // à mesma diária) — força a quebra de página após a última página.
  ultimoDocumento?: boolean;
}) {
  if (fotos.length === 0 && documentos.length === 0) return null;

  const paginasDeFotos: Foto[][] =
    fotos.length > 0
      ? Array.from({ length: Math.ceil(fotos.length / FOTOS_POR_PAGINA) }, (_, i) =>
          fotos.slice(i * FOTOS_POR_PAGINA, (i + 1) * FOTOS_POR_PAGINA),
        )
      : [[]];

  return (
    <>
      {paginasDeFotos.map((grupo, indice) => {
        const ultimaPagina = indice === paginasDeFotos.length - 1;
        return (
          <PaginaA4 key={indice} quebrarPagina={!ultimaPagina || !ultimoDocumento}>
            <div className="mx-[15mm] mt-[32mm] mb-[26mm] flex flex-1 flex-col">
              <TabelaGrid>
                <Celula span={12} className={`${headerCell} text-[10pt]`}>
                  COMPROVANTES
                </Celula>
                <Celula span={12} className="min-h-[220mm]">
                  {grupo.length > 0 ? (
                    <div className="flex h-full flex-col gap-3 p-1">
                      {grupo.map((foto, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={foto.url}
                          alt={foto.nome}
                          className="h-[105mm] w-full rounded border border-slate-300 object-cover"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="p-2 text-center text-slate-400">Nenhum comprovante anexado.</p>
                  )}
                  {ultimaPagina && documentos.length > 0 && (
                    <div className="mt-4 p-1 text-[8pt]">
                      <p className="font-semibold">Documentos anexados:</p>
                      <ul className="list-disc pl-4">
                        {documentos.map((doc, i) => (
                          <li key={i}>{doc.nome}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Celula>
              </TabelaGrid>
            </div>
          </PaginaA4>
        );
      })}
    </>
  );
}
