import { PaginaA4 } from "../celula";
import { dataPorExtenso } from "@/lib/pdf/formato";
import {
  artigosTituloHonorario,
  NOME_CAMARA,
  SUBTITULO_TITULO_HONORARIO,
  tituloProjetoDecreto,
} from "@/lib/decretos/documento";
import { paginarTextoCorrido } from "@/lib/pdf/paginacao";
import type { Tratamento } from "@/lib/supabase/database.types";

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

function AssinaturaAutor({ decreto }: { decreto: Decreto }) {
  return (
    <div className="mx-auto mt-[10mm] w-[90mm] text-center">
      <p className="font-bold">{decreto.autor_nome}</p>
      <p>Vereador(a){decreto.autor_partido ? ` – ${decreto.autor_partido}` : ""}</p>
    </div>
  );
}

export function DecretoConteudo({ decreto }: { decreto: Decreto }) {
  const artigos = artigosTituloHonorario({
    tratamento: decreto.tratamento,
    nomeHomenageado: decreto.nome_homenageado,
    dotacaoOrcamentaria: decreto.dotacao_orcamentaria,
  });

  const paragrafosJustificativa = decreto.justificativa
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  // A justificativa varia muito de tamanho de um decreto pro outro — em vez
  // de uma única página fixa (que já vazou texto por cima do rodapé do
  // timbrado num teste com biografia mais longa), divide dinamicamente em
  // quantas páginas forem necessárias, só repetindo o título "JUSTIFICATIVA"
  // na primeira e só fechando com data/assinatura na última.
  const paginasJustificativa = paginarTextoCorrido(paragrafosJustificativa);

  return (
    <>
      <PaginaA4>
        <div className="mx-[30mm] mt-[32mm] mb-[26mm] flex flex-1 flex-col text-[11pt] leading-relaxed">
          <p className="text-center font-bold">
            {tituloProjetoDecreto({ numero: decreto.numero, dataDecreto: decreto.data_decreto })}
          </p>
          <p className="mt-1 text-center font-bold uppercase">{SUBTITULO_TITULO_HONORARIO}</p>

          <p className="mt-6 text-justify">
            A {NOME_CAMARA} de Minas Gerais, aprova e eu, promulgo o seguinte Decreto Legislativo:
          </p>

          <div className="mt-4 space-y-3">
            {artigos.map((artigo) => (
              <p key={artigo} className="text-justify">
                {artigo}
              </p>
            ))}
          </div>

          <p className="mt-8 text-right">
            {NOME_CAMARA}, {dataPorExtenso(decreto.data_decreto)}.
          </p>

          <AssinaturaAutor decreto={decreto} />
        </div>
      </PaginaA4>

      {paginasJustificativa.map((paragrafos, indice) => {
        const primeiraPagina = indice === 0;
        const ultimaPagina = indice === paginasJustificativa.length - 1;
        return (
          <PaginaA4 key={indice} quebrarPagina={!ultimaPagina}>
            <div className="mx-[30mm] mt-[32mm] mb-[26mm] flex flex-1 flex-col text-[11pt] leading-relaxed">
              {primeiraPagina && <p className="text-center font-bold">JUSTIFICATIVA</p>}

              <div className={`space-y-3 ${primeiraPagina ? "mt-4" : ""}`}>
                {paragrafos.map((paragrafo, i) => (
                  <p key={i} className="text-justify">
                    {paragrafo}
                  </p>
                ))}
              </div>

              {ultimaPagina && (
                <>
                  <p className="mt-8 text-right">
                    {NOME_CAMARA}, {dataPorExtenso(decreto.data_decreto)}.
                  </p>
                  <AssinaturaAutor decreto={decreto} />
                </>
              )}
            </div>
          </PaginaA4>
        );
      })}
    </>
  );
}
