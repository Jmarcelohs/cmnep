import { PaginaA4 } from "../celula";
import { dataPorExtenso } from "@/lib/pdf/formato";
import {
  artigosTituloHonorario,
  COMISSAO_CCJ,
  COMISSAO_FINANCAS,
  NOME_CAMARA,
  SUBTITULO_TITULO_HONORARIO,
  tituloProjetoDecreto,
  type ComposicaoComissao,
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

// Deixa em negrito o prefixo "Art. N° –" e, dentro do texto do artigo,
// o nome do homenageado (só aparece no Art. 1º, mas a função não presume
// isso — só busca a ocorrência literal do nome).
function ArtigoFormatado({ texto, nomeHomenageado }: { texto: string; nomeHomenageado: string }) {
  const match = texto.match(/^(Art\.\s*\d+°\s*–\s*)([\s\S]*)$/);
  if (!match) return <>{texto}</>;
  const [, prefixo, resto] = match;

  const partes = resto.split(nomeHomenageado);
  const corpo =
    partes.length === 1
      ? resto
      : partes.flatMap((parte, i) =>
          i < partes.length - 1
            ? [<span key={i}>{parte}</span>, <strong key={`${i}-nome`}>{nomeHomenageado}</strong>]
            : [<span key={i}>{parte}</span>],
        );

  return (
    <>
      <strong>{prefixo}</strong>
      {corpo}
    </>
  );
}

function AssinaturaAutor({ decreto }: { decreto: Decreto }) {
  return (
    <div className="mx-auto mt-[10mm] w-[90mm] text-center">
      <p className="font-bold">{decreto.autor_nome}</p>
      <p>Vereador(a){decreto.autor_partido ? ` – ${decreto.autor_partido}` : ""}</p>
    </div>
  );
}

// Parecer de comissão permanente — página fixa entre o texto do decreto e
// a justificativa, reproduzindo os carimbos de CCJ e Finanças que já
// acompanham todo Projeto de Decreto real da Câmara (linha em branco pra
// data e assinatura preenchidas à mão após a reunião da comissão).
function ParecerComissao({ comissao }: { comissao: ComposicaoComissao }) {
  return (
    <div className="rounded-md border border-black p-6 text-center">
      <p className="font-bold uppercase">{comissao.titulo}</p>
      <p className="mt-6 text-slate-500">_______________ / _______________ / _______________</p>
      {/* Espaço maior entre os nomes — cada um precisa de linha em branco
          suficiente pra assinatura física por cima do nome impresso. */}
      <div className="mt-6 space-y-10">
        {comissao.membros.map((membro) => (
          <p key={membro} className="font-semibold">
            {membro}
          </p>
        ))}
      </div>
    </div>
  );
}

// Altura reservada pro bloco da foto (imagem + margem inferior) na primeira
// página da justificativa, somada ao orçamento de linhas de texto — ver
// paginarTextoCorrido em @/lib/pdf/paginacao. Precisa acompanhar a altura
// da foto (h-[120mm], meia página) mais uma folga de margem.
const ALTURA_BLOCO_FOTO_MM = 135;

export function DecretoConteudo({ decreto, fotoUrl }: { decreto: Decreto; fotoUrl?: string | null }) {
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
  // (e a foto, se houver) na primeira, e só fechando com data/assinatura na
  // última.
  const paginasJustificativa = paginarTextoCorrido(
    paragrafosJustificativa,
    fotoUrl ? ALTURA_BLOCO_FOTO_MM : 0,
  );

  return (
    <>
      <PaginaA4>
        <div className="ml-[30mm] mr-[20mm] mt-[32mm] mb-[26mm] flex flex-1 flex-col text-[12pt] leading-relaxed">
          <p className="text-center font-bold">
            {tituloProjetoDecreto({ numero: decreto.numero, dataDecreto: decreto.data_decreto })}
          </p>
          {/* Ementa: recuada à direita (mesmo recuo do modelo original,
              ~80mm a partir da margem) e com o parágrafo justificado — não
              centralizada, convenção de redação legislativa. */}
          <p className="mt-1 ml-[80mm] text-justify font-bold uppercase">{SUBTITULO_TITULO_HONORARIO}</p>

          <p className="mt-6 indent-[1.25cm] text-justify">
            A {NOME_CAMARA} de Minas Gerais, aprova e eu, promulgo o seguinte Decreto Legislativo:
          </p>

          <div className="mt-4 space-y-3">
            {artigos.map((artigo) => (
              <p key={artigo} className="text-justify">
                <ArtigoFormatado texto={artigo} nomeHomenageado={decreto.nome_homenageado} />
              </p>
            ))}
          </div>

          <p className="mt-8 text-right">
            {NOME_CAMARA}, {dataPorExtenso(decreto.data_decreto)}.
          </p>

          <AssinaturaAutor decreto={decreto} />
        </div>
      </PaginaA4>

      <PaginaA4>
        <div className="ml-[30mm] mr-[20mm] mt-[32mm] mb-[26mm] flex flex-1 flex-col justify-center gap-[16mm] text-[10pt]">
          <ParecerComissao comissao={COMISSAO_CCJ} />
          <ParecerComissao comissao={COMISSAO_FINANCAS} />
        </div>
      </PaginaA4>

      {paginasJustificativa.map((paragrafos, indice) => {
        const primeiraPagina = indice === 0;
        const ultimaPagina = indice === paginasJustificativa.length - 1;
        return (
          <PaginaA4 key={indice} quebrarPagina={!ultimaPagina}>
            <div className="ml-[30mm] mr-[20mm] mt-[32mm] mb-[26mm] flex flex-1 flex-col text-[12pt] leading-relaxed">
              {primeiraPagina && <p className="text-center font-bold">JUSTIFICATIVA</p>}

              {primeiraPagina && fotoUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- imagem vem de uma URL assinada do Storage, resolvida no servidor pra essa renderização do PDF
                <img
                  src={fotoUrl}
                  alt={`Foto de ${decreto.nome_homenageado}`}
                  className="mx-auto mt-3 h-[120mm] w-[80mm] rounded border border-black object-cover"
                />
              )}

              <div className={`space-y-1 ${primeiraPagina ? "mt-4" : ""}`}>
                {paragrafos.map((paragrafo, i) => (
                  <p key={i} className="indent-[1.25cm] text-justify">
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
