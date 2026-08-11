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

type TamanhoAssinatura = {
  altura: string;
  largura: string;
  coluna: string;
  colunas: number;
  gap: string;
  nomeSize: string;
  cargoSize: string;
};

// Tamanho de assinatura padronizado por comparação direta com um
// documento real já emitido pela Câmara (Congratulação — Camila Rezende
// Batista Moreira, medido em ~17-18mm de altura de imagem) — usado fixo
// independente do número de signatários, pra manter a moção idêntica ao
// modelo original. A largura da coluna de texto difere por orientação:
// não dá pra usar a mesma largura nos dois tipos porque a Pesar é
// retrato (210mm) e a Congratulação é paisagem (297mm) — com 3 colunas +
// os 28mm de margem de cada lado da Pesar, cada coluna ali tem só
// ~48,5mm disponíveis; usar os 63mm da Congratulação faz o texto de uma
// coluna invadir a de baixo (confirmado ao vivo).
const ASSINATURA_PADRAO: Record<"retrato" | "paisagem", TamanhoAssinatura> = {
  paisagem: { altura: "16mm", largura: "50mm", coluna: "63mm", colunas: 3, gap: "gap-y-8", nomeSize: "10pt", cargoSize: "7pt" },
  retrato: { altura: "16mm", largura: "50mm", coluna: "46mm", colunas: 3, gap: "gap-y-8", nomeSize: "10pt", cargoSize: "7pt" },
};

// Só entra em cena com os 11 vereadores da Casa assinando juntos (4
// linhas numa grade de 3 colunas, o máximo possível no sistema) — nesse
// caso extremo, o tamanho padrão acima (medido no documento real, que só
// tinha 5 signatários) estoura pra uma segunda página. A solução não é
// só encolher a assinatura: passando pra 4 colunas, os 11 signatários
// cabem em só 3 linhas (em vez de 4), sobrando espaço suficiente pra usar
// uma imagem bem maior do que a versão anterior (6mm) — testado ao vivo.
const ASSINATURA_COMPACTA: Record<"retrato" | "paisagem", TamanhoAssinatura> = {
  paisagem: { altura: "13mm", largura: "40mm", coluna: "44mm", colunas: 4, gap: "gap-y-2", nomeSize: "9pt", cargoSize: "6.5pt" },
  retrato: { altura: "14mm", largura: "42mm", coluna: "32mm", colunas: 4, gap: "gap-y-2", nomeSize: "9pt", cargoSize: "6.5pt" },
};

function tamanhoAssinatura(
  totalSignatarios: number,
  orientacao: "retrato" | "paisagem",
): TamanhoAssinatura {
  const linhas = Math.ceil(totalSignatarios / 3);
  return linhas >= 4 ? ASSINATURA_COMPACTA[orientacao] : ASSINATURA_PADRAO[orientacao];
}

// A partir desse total de signatários, a Congratulação entra no modo
// compacto (grade de 4 colunas — ver ASSINATURA_COMPACTA) — usado tanto
// pra decidir o tamanho da assinatura quanto pra encolher o nome do
// homenageado e os espaçamentos ao redor, liberando mais espaço vertical
// nesse caso extremo.
const LIMIAR_COMPACTO = 10;

// No modo compacto, um nome de homenageado longo (nome de instituição,
// por exemplo) pode quebrar em 4 linhas mesmo já reduzido a 26pt — testado
// ao vivo com 10 signatários + um nome de ~100 caracteres, o que estourava
// pra 2 páginas mesmo com a grade de 4 colunas. Acima desse limiar de
// caracteres, encolhe mais um degrau (20pt) pra tentar segurar em 3 linhas
// e devolver espaço vertical suficiente pra grade inteira caber numa
// página só.
const LIMIAR_NOME_MUITO_LONGO = 55;

function tamanhoNomeHomenageado(
  destinatario: string,
  compacto: boolean,
): { fontSize: string; margemTopo: string } {
  if (!compacto) return { fontSize: "36pt", margemTopo: "mt-6" };
  if (destinatario.length > LIMIAR_NOME_MUITO_LONGO) {
    return { fontSize: "20pt", margemTopo: "mt-2" };
  }
  return { fontSize: "26pt", margemTopo: "mt-3" };
}

// Imagem de assinatura escaneada colada acima do nome — se o vereador
// ainda não tem assinatura cadastrada (ver /vereadores), fica só a linha
// em branco pra assinatura física por cima, mesma convenção do Parecer de
// Comissão em decreto-conteudo.tsx. Fonte/tamanhos (10pt no nome, 7pt no
// cargo, nome sem negrito) reproduzem o documento real de Congratulação
// usado como referência de padronização.
function BlocoAssinatura({
  signatario,
  assinaturaUrl,
  tamanho,
}: {
  signatario: VereadorSignatario;
  assinaturaUrl: string | null;
  tamanho: TamanhoAssinatura;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex items-end justify-center" style={{ height: tamanho.altura }}>
        {assinaturaUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- imagem vem de uma URL assinada do Storage, resolvida no servidor pra essa renderização do PDF
          <img
            src={assinaturaUrl}
            alt=""
            className="object-contain"
            style={{ maxHeight: tamanho.altura, maxWidth: tamanho.largura }}
          />
        )}
      </div>
      <div
        className="border-t border-black pt-0.5"
        style={{ width: tamanho.coluna, fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        <p style={{ fontSize: tamanho.nomeSize }}>{signatario.nome}</p>
        <p className="leading-tight" style={{ fontSize: tamanho.cargoSize }}>
          {legendaAssinatura(signatario)}
        </p>
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
  const tamanho = tamanhoAssinatura(signatarios.length, orientacao);
  return (
    <div className={`grid gap-x-4 ${tamanho.gap}`} style={{ gridTemplateColumns: `repeat(${tamanho.colunas}, 1fr)` }}>
      {signatarios.map((s) => (
        <BlocoAssinatura key={s.id} signatario={s} assinaturaUrl={assinaturasPorId[s.id] ?? null} tamanho={tamanho} />
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
  // A partir de 10 signatários (Presidente incluído automaticamente), o
  // nome do homenageado encolhe e os espaçamentos apertam — abre espaço
  // vertical extra pra grade de assinaturas de 4 colunas caber numa
  // página só (ver ASSINATURA_COMPACTA/LIMIAR_COMPACTO). Com menos
  // signatários, tudo segue igual ao documento real de referência.
  const compacto = signatarios.length >= LIMIAR_COMPACTO;
  const nomeHomenageado = tamanhoNomeHomenageado(mocao.destinatario, compacto);

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

        <p
          className={`text-center font-bold uppercase leading-[1.05] ${nomeHomenageado.margemTopo}`}
          style={{ fontSize: nomeHomenageado.fontSize }}
        >
          {mocao.destinatario}
        </p>

        <div className={`space-y-2 ${compacto ? "mt-3" : "mt-6"}`}>
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

        <p className={`text-right ${compacto ? "mt-4" : "mt-8"}`}>{fechoMocao(mocao.data_mocao)}</p>

        <div className={compacto ? "mt-4" : "mt-8"}>
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
