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

// Tamanho de assinatura padronizado por comparação direta com um
// documento real já emitido pela Câmara (Congratulação — Camila Rezende
// Batista Moreira, medido em ~17-18mm de altura de imagem) — usado fixo
// pros dois tipos, sem reduzir conforme o número de signatários. Em
// moções com muitos signatários (ex.: os 11 vereadores da Casa
// assinando juntos) isso pode fazer a assinatura invadir o nome/cargo
// abaixo dela, exatamente como acontece no próprio documento real usado
// de referência — aceito conscientemente pra manter a moção padronizada
// com o modelo original.
const ASSINATURA_ALTURA = "16mm";
const ASSINATURA_LARGURA = "50mm";

// Largura da coluna de assinatura, por orientação — não dá pra usar a
// mesma largura nos dois tipos porque a Pesar é retrato (210mm) e a
// Congratulação é paisagem (297mm). Com 3 colunas + os 28mm de margem de
// cada lado da Pesar, cada coluna real tem só ~48,5mm de largura
// disponível; usar os 64mm da Congratulação ali faz o texto de uma
// coluna invadir a de baixo (confirmado ao vivo). 63mm cabe justo nos
// ~63,85mm disponíveis na Congratulação; 46mm fica dentro dos ~48,5mm da
// Pesar com uma pequena folga.
const LARGURA_COLUNA: Record<"retrato" | "paisagem", string> = {
  paisagem: "63mm",
  retrato: "46mm",
};

// Imagem de assinatura escaneada colada acima do nome — se o vereador
// ainda não tem assinatura cadastrada (ver /vereadores), fica só a linha
// em branco pra assinatura física por cima, mesma convenção do Parecer de
// Comissão em decreto-conteudo.tsx. Fonte/tamanhos (10pt no nome, 7pt no
// cargo, nome sem negrito) reproduzem o documento real de Congratulação
// usado como referência de padronização.
function BlocoAssinatura({
  signatario,
  assinaturaUrl,
  larguraColuna,
}: {
  signatario: VereadorSignatario;
  assinaturaUrl: string | null;
  larguraColuna: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-end justify-center" style={{ height: ASSINATURA_ALTURA }}>
        {assinaturaUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- imagem vem de uma URL assinada do Storage, resolvida no servidor pra essa renderização do PDF
          <img
            src={assinaturaUrl}
            alt=""
            className="object-contain"
            style={{ maxHeight: ASSINATURA_ALTURA, maxWidth: ASSINATURA_LARGURA }}
          />
        )}
      </div>
      <div className="border-t border-black pt-0.5" style={{ width: larguraColuna, fontFamily: "Arial, Helvetica, sans-serif" }}>
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
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-8">
      {signatarios.map((s) => (
        <BlocoAssinatura
          key={s.id}
          signatario={s}
          assinaturaUrl={assinaturasPorId[s.id] ?? null}
          larguraColuna={LARGURA_COLUNA[orientacao]}
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
      {/* Margens ajustadas por medição direta no documento real (89,5mm a
          289,8mm de área útil) — com a margem original de 95mm/12mm, a
          frase de abertura quebrava numa linha a mais que no documento
          real (a fonte Nunito é um pouco mais larga que a Maiandra GD
          original por caractere). Um pouco mais estreita que a medição
          bruta pra realmente fechar em 3 linhas como no original. */}
      <div
        className="ml-[87mm] mr-[5mm] mt-[46mm] flex flex-1 flex-col text-[12pt] leading-[1.15]"
        style={{ fontFamily: FONTE_CORPO }}
      >
        <p className="text-justify">
          <Segmentos segmentos={aberturaCongratulacaoSegmentos({ autorNome, associadosNomes })} />
        </p>

        <p className="mt-6 text-center text-[36pt] font-bold uppercase leading-[1.05]">
          {mocao.destinatario}
        </p>

        <div className="mt-6 space-y-2">
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

        <p className="mt-8 text-right">{fechoMocao(mocao.data_mocao)}</p>

        <div className="mt-8">
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
        className="ml-[28mm] mr-[28mm] mt-[48mm] flex flex-1 flex-col text-[12pt] leading-[1.15]"
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

        <p className="mt-4 text-justify">
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

        <div className="mt-4 space-y-4">
          {PARAGRAFOS_PESAR_FIXOS.map((p, i) => (
            <p key={i} className="text-justify">
              {p}
            </p>
          ))}
        </div>

        <p className="mt-8">{fechoMocao(mocao.data_mocao)}</p>

        <div className="mt-10">
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
