import { PaginaA4 } from "../celula";
import { corpoAberturaMocao, fechoMocao, tituloMocao } from "@/lib/mocoes/documento";
import { paginarTextoCorrido } from "@/lib/pdf/paginacao";
import type { TipoMocao } from "@/lib/supabase/database.types";

type Mocao = {
  tipo: TipoMocao;
  data_mocao: string;
  destinatario: string;
  autor_nome: string;
  autor_partido: string | null;
  justificativa: string;
};

function AssinaturaAutor({ mocao }: { mocao: Mocao }) {
  return (
    <div className="mx-auto mt-[10mm] w-[90mm] text-center">
      <p className="font-bold">{mocao.autor_nome}</p>
      <p>Vereador(a){mocao.autor_partido ? ` – ${mocao.autor_partido}` : ""}</p>
    </div>
  );
}

export function MocaoConteudo({ mocao }: { mocao: Mocao }) {
  const abertura = corpoAberturaMocao({
    tipo: mocao.tipo,
    destinatario: mocao.destinatario,
    autorNome: mocao.autor_nome,
    autorPartido: mocao.autor_partido,
  });

  const paragrafosJustificativa = mocao.justificativa
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  // A justificativa varia de tamanho de uma moção pra outra — divide
  // dinamicamente em quantas páginas forem necessárias (mesma técnica do
  // Decreto de Título Honorário), só fechando com data/assinatura na
  // última.
  const paginas = paginarTextoCorrido(paragrafosJustificativa, 0);

  return (
    <>
      {paginas.map((paragrafos, indice) => {
        const primeiraPagina = indice === 0;
        const ultimaPagina = indice === paginas.length - 1;
        return (
          <PaginaA4 key={indice} quebrarPagina={!ultimaPagina}>
            <div className="ml-[30mm] mr-[20mm] mt-[32mm] mb-[26mm] flex flex-1 flex-col text-[12pt] leading-relaxed">
              {primeiraPagina && (
                <>
                  <p className="text-center font-bold">{tituloMocao(mocao.tipo)}</p>
                  <p className="mt-6 text-justify">{abertura}</p>
                </>
              )}

              <div className={`space-y-3 ${primeiraPagina ? "mt-4" : ""}`}>
                {paragrafos.map((paragrafo, i) => (
                  <p key={i} className="indent-[1.25cm] text-justify">
                    {paragrafo}
                  </p>
                ))}
              </div>

              {ultimaPagina && (
                <>
                  <p className="mt-8 text-right">{fechoMocao(mocao.data_mocao)}</p>
                  <AssinaturaAutor mocao={mocao} />
                </>
              )}
            </div>
          </PaginaA4>
        );
      })}
    </>
  );
}
