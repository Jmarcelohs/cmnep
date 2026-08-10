import { PaginaA4 } from "../celula";
import {
  aberturaCongratulacaoSegmentos,
  aberturaPesarSegmentos,
  enderecamentoPesarSegmentos,
  fechoMocao,
  legendaAssinatura,
  ordenarSignatarios,
  PARAGRAFOS_PESAR_FIXOS,
  type SegmentoMocao,
  type VereadorSignatario,
} from "@/lib/mocoes/documento";
import type { TipoMocao, Tratamento } from "@/lib/supabase/database.types";

export type Mocao = {
  tipo: TipoMocao;
  data_mocao: string;
  destinatario: string;
  destinatario_tratamento: Tratamento | null;
  justificativa: string;
};

function Segmentos({ segmentos }: { segmentos: SegmentoMocao[] }) {
  return (
    <>
      {segmentos.map((s, i) =>
        s.negrito ? <strong key={i}>{s.texto}</strong> : <span key={i}>{s.texto}</span>,
      )}
    </>
  );
}

// Tamanho da imagem da assinatura escalado pela quantidade de linhas da
// grade — o Presidente assina obrigatoriamente toda moção (art. 117 do
// Regimento Interno), então o número de signatários varia bastante de
// uma moção pra outra; sem isso, uma moção com muitos vereadores
// associados estouraria o espaço disponível antes do rodapé do timbrado.
// A Congratulação tem bem menos altura de página disponível que o Pesar
// (A4 paisagem = 210mm vs retrato = 297mm, com um texto de abertura +
// nome do homenageado em 36pt acima da grade), então usa um orçamento
// mais conservador — testado ao vivo com 5 signatários (2 linhas) e um
// nome de homenageado longo (3 linhas) sem estourar pra uma segunda
// página.
//
// No Pesar, a logo da Câmara fica no rodapé (~196mm de uma página de
// 297mm) — testado ao vivo com 1 linha (24mm, folga confortável), 2
// linhas (24mm sobrepunha a legenda da 2ª linha na logo; 18mm resolveu)
// e 3 linhas (16mm, folga confortável).
function tamanhoAssinatura(
  totalSignatarios: number,
  orientacao: "retrato" | "paisagem",
): { maxH: string; maxW: string; gap: string } {
  const linhas = Math.ceil(totalSignatarios / 3);
  if (orientacao === "paisagem") {
    if (linhas <= 1) return { maxH: "20mm", maxW: "55mm", gap: "gap-y-2" };
    if (linhas === 2) return { maxH: "13mm", maxW: "48mm", gap: "gap-y-1" };
    return { maxH: "9mm", maxW: "38mm", gap: "gap-y-1" };
  }
  if (linhas <= 1) return { maxH: "24mm", maxW: "60mm", gap: "gap-y-4" };
  if (linhas === 2) return { maxH: "18mm", maxW: "55mm", gap: "gap-y-2" };
  if (linhas === 3) return { maxH: "16mm", maxW: "50mm", gap: "gap-y-2" };
  return { maxH: "12mm", maxW: "42mm", gap: "gap-y-1" };
}

// Imagem de assinatura escaneada colada acima do nome — se o vereador
// ainda não tem assinatura cadastrada (ver /vereadores), fica só a linha
// em branco pra assinatura física por cima, mesma convenção do Parecer de
// Comissão em decreto-conteudo.tsx. Fonte/tamanhos (Calibri 10pt no nome,
// 7pt no cargo, nome sem negrito) reproduzem o documento real de
// Congratulação usado como referência de padronização.
function BlocoAssinatura({
  signatario,
  assinaturaUrl,
  maxH,
  maxW,
}: {
  signatario: VereadorSignatario;
  assinaturaUrl: string | null;
  maxH: string;
  maxW: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-end justify-center" style={{ height: maxH }}>
        {assinaturaUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- imagem vem de uma URL assinada do Storage, resolvida no servidor pra essa renderização do PDF
          <img
            src={assinaturaUrl}
            alt=""
            className="object-contain"
            style={{ maxHeight: maxH, maxWidth: maxW }}
          />
        )}
      </div>
      <div className="w-[55mm] border-t border-black pt-0.5" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
        <p className="text-[10pt]">{signatario.nome}</p>
        <p className="text-[7pt] leading-tight">{legendaAssinatura(signatario)}</p>
      </div>
    </div>
  );
}

function GradeAssinaturas({
  signatarios,
  assinaturasPorId,
  orientacao,
}: {
  signatarios: VereadorSignatario[];
  assinaturasPorId: Record<string, string | null>;
  orientacao: "retrato" | "paisagem";
}) {
  const { maxH, maxW, gap } = tamanhoAssinatura(signatarios.length, orientacao);
  return (
    <div className={`grid grid-cols-3 gap-x-4 ${gap}`}>
      {signatarios.map((s) => (
        <BlocoAssinatura
          key={s.id}
          signatario={s}
          assinaturaUrl={assinaturasPorId[s.id] ?? null}
          maxH={maxH}
          maxW={maxW}
        />
      ))}
    </div>
  );
}

// Fonte/tamanhos do corpo (12pt, entrelinha 1,15) reproduzem o documento
// real de Congratulação usado como referência. A fonte original (Maiandra
// GD) é uma fonte comercial da Monotype licenciada junto com o
// Windows/Office — embutir o arquivo real no site redistribuiria esse
// arquivo publicamente (qualquer um poderia baixá-lo pela URL), o que
// pode violar os termos de licença. Nunito (Google Fonts, licença OFL
// livre) é o substituto: mesma família humanista arredondada, boa
// legibilidade em corpo de texto — auto-hospedada via @fontsource (ver
// layout.tsx do grupo de impressão).
const FONTE_CORPO = "Nunito, Arial, Helvetica, sans-serif";

function CongratulacaoConteudo({
  mocao,
  signatarios,
  autorNome,
  associadosNomes,
  assinaturasPorId,
}: {
  mocao: Mocao;
  signatarios: VereadorSignatario[];
  autorNome: string;
  associadosNomes: string[];
  assinaturasPorId: Record<string, string | null>;
}) {
  return (
    <PaginaA4 orientacao="paisagem" backgroundImage="/timbrado/mocao-congratulacoes.jpg">
      <div
        className="ml-[95mm] mr-[12mm] mt-[55mm] flex flex-1 flex-col text-[12pt] leading-[1.15]"
        style={{ fontFamily: FONTE_CORPO }}
      >
        <p className="text-justify">
          <Segmentos segmentos={aberturaCongratulacaoSegmentos({ autorNome, associadosNomes })} />
        </p>

        <p className="mt-4 text-center text-[36pt] font-bold uppercase leading-[1.05]">
          {mocao.destinatario}
        </p>

        <div className="mt-4 space-y-2">
          {mocao.justificativa
            .split(/\n+/)
            .map((p) => p.trim())
            .filter(Boolean)
            .map((p, i) => (
              <p key={i} className="text-justify">
                {p}
              </p>
            ))}
        </div>

        <p className="mt-5 text-right">{fechoMocao(mocao.data_mocao)}</p>

        <div className="mt-4">
          <GradeAssinaturas
            signatarios={signatarios}
            assinaturasPorId={assinaturasPorId}
            orientacao="paisagem"
          />
        </div>
      </div>
    </PaginaA4>
  );
}

function PesarConteudo({
  mocao,
  signatarios,
  autor,
  associadosNomes,
  assinaturasPorId,
}: {
  mocao: Mocao;
  signatarios: VereadorSignatario[];
  autor: VereadorSignatario;
  associadosNomes: string[];
  assinaturasPorId: Record<string, string | null>;
}) {
  const tratamento = mocao.destinatario_tratamento ?? "Sr.";
  return (
    <PaginaA4 backgroundImage="/timbrado/mocao-pesar.jpg">
      <div
        className="ml-[28mm] mr-[28mm] mt-[40mm] flex flex-1 flex-col text-[12pt] leading-[1.15]"
        style={{ fontFamily: FONTE_CORPO }}
      >
        <p>
          <Segmentos
            segmentos={enderecamentoPesarSegmentos({
              destinatarioNome: mocao.destinatario,
              destinatarioTratamento: tratamento,
            })}
          />
        </p>

        <p className="mt-3 text-justify">
          <Segmentos
            segmentos={aberturaPesarSegmentos({
              autorNome: autor.nome,
              autorGenero: autor.genero,
              associadosNomes,
              destinatarioNome: mocao.destinatario,
              destinatarioTratamento: tratamento,
            })}
          />
        </p>

        <div className="mt-3 space-y-2">
          {PARAGRAFOS_PESAR_FIXOS.map((p, i) => (
            <p key={i} className="text-justify">
              {p}
            </p>
          ))}
        </div>

        <p className="mt-4">{fechoMocao(mocao.data_mocao)}</p>

        <div className="mt-4">
          <GradeAssinaturas
            signatarios={signatarios}
            assinaturasPorId={assinaturasPorId}
            orientacao="retrato"
          />
        </div>
      </div>
    </PaginaA4>
  );
}

export function MocaoConteudo({
  mocao,
  autor,
  associados,
  assinaturasPorId,
}: {
  mocao: Mocao;
  autor: VereadorSignatario;
  associados: VereadorSignatario[];
  // URL assinada (Storage) por id de vereador, resolvida no servidor —
  // null quando o vereador ainda não tem assinatura cadastrada.
  assinaturasPorId: Record<string, string | null>;
}) {
  const signatarios = ordenarSignatarios([autor, ...associados]);
  const associadosNomes = associados.map((v) => v.nome);

  if (mocao.tipo === "pesar") {
    return (
      <PesarConteudo
        mocao={mocao}
        signatarios={signatarios}
        autor={autor}
        associadosNomes={associadosNomes}
        assinaturasPorId={assinaturasPorId}
      />
    );
  }

  return (
    <CongratulacaoConteudo
      mocao={mocao}
      signatarios={signatarios}
      autorNome={autor.nome}
      associadosNomes={associadosNomes}
      assinaturasPorId={assinaturasPorId}
    />
  );
}
