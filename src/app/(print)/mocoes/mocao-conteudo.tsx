import { PaginaA4 } from "../celula";
import { corpoAberturaMocao, fechoMocao, PRESIDENTE, tituloMocao } from "@/lib/mocoes/documento";
import { paginarTextoCorrido } from "@/lib/pdf/paginacao";
import type { AutorAssociadoMocao, TipoMocao } from "@/lib/supabase/database.types";

type Mocao = {
  tipo: TipoMocao;
  data_mocao: string;
  destinatario: string;
  autor_nome: string;
  autor_partido: string | null;
  autores_associados: AutorAssociadoMocao[];
  justificativa: string;
};

// Reserva de altura, por signatário além do autor principal (já coberto
// pela reserva base de paginarTextoCorrido), pra evitar que o bloco de
// assinaturas estoure por cima do rodapé do timbrado numa moção com vários
// vereadores associados — ver comentário em paginarTextoCorrido.
const ALTURA_POR_SIGNATARIO_EXTRA_MM = 22;

function BlocoAssinatura({ nome, cargo }: { nome: string; cargo: string }) {
  return (
    <div className="mx-auto mt-[8mm] w-[90mm] text-center">
      <p className="font-bold">{nome}</p>
      <p>{cargo}</p>
    </div>
  );
}

function AssinaturasMocao({ mocao }: { mocao: Mocao }) {
  return (
    <div className="mt-[6mm]">
      <BlocoAssinatura nome={PRESIDENTE} cargo="Presidente da Câmara Municipal de Nepomuceno" />
      <BlocoAssinatura
        nome={mocao.autor_nome}
        cargo={`Vereador(a)${mocao.autor_partido ? ` – ${mocao.autor_partido}` : ""} (Autor)`}
      />
      {mocao.autores_associados.map((a, i) => (
        <BlocoAssinatura
          key={i}
          nome={a.nome}
          cargo={`Vereador(a)${a.partido ? ` – ${a.partido}` : ""}`}
        />
      ))}
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
  // Decreto de Título Honorário), só fechando com data/assinaturas na
  // última. A reserva de assinatura cresce com o Presidente + cada
  // vereador associado (o autor principal já está na reserva base).
  const alturaExtraAssinatura = (1 + mocao.autores_associados.length) * ALTURA_POR_SIGNATARIO_EXTRA_MM;
  const paginas = paginarTextoCorrido(paragrafosJustificativa, 0, alturaExtraAssinatura);

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
                  <AssinaturasMocao mocao={mocao} />
                </>
              )}
            </div>
          </PaginaA4>
        );
      })}
    </>
  );
}
