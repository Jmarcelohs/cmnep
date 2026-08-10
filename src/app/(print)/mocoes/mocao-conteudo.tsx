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

// Imagem de assinatura escaneada colada acima do nome — se o vereador
// ainda não tem assinatura cadastrada (ver /vereadores), fica só a linha
// em branco pra assinatura física por cima, mesma convenção do Parecer de
// Comissão em decreto-conteudo.tsx.
function BlocoAssinatura({
  signatario,
  assinaturaUrl,
}: {
  signatario: VereadorSignatario;
  assinaturaUrl: string | null;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-[16mm] items-end justify-center">
        {assinaturaUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- imagem vem de uma URL assinada do Storage, resolvida no servidor pra essa renderização do PDF
          <img src={assinaturaUrl} alt="" className="max-h-[16mm] max-w-[50mm] object-contain" />
        )}
      </div>
      <div className="w-[55mm] border-t border-black pt-1">
        <p className="font-bold">{signatario.nome}</p>
        <p className="text-[8pt]">{legendaAssinatura(signatario)}</p>
      </div>
    </div>
  );
}

function GradeAssinaturas({
  signatarios,
  assinaturasPorId,
}: {
  signatarios: VereadorSignatario[];
  assinaturasPorId: Record<string, string | null>;
}) {
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-8">
      {signatarios.map((s) => (
        <BlocoAssinatura key={s.id} signatario={s} assinaturaUrl={assinaturasPorId[s.id] ?? null} />
      ))}
    </div>
  );
}

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
      <div className="ml-[95mm] mr-[12mm] mt-[46mm] flex flex-1 flex-col text-[11pt] leading-relaxed">
        <p className="text-justify">
          <Segmentos segmentos={aberturaCongratulacaoSegmentos({ autorNome, associadosNomes })} />
        </p>

        <p className="mt-6 text-center text-[18pt] font-bold uppercase">{mocao.destinatario}</p>

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
          <GradeAssinaturas signatarios={signatarios} assinaturasPorId={assinaturasPorId} />
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
      <div className="ml-[28mm] mr-[28mm] mt-[48mm] flex flex-1 flex-col text-[11pt] leading-relaxed">
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
          <GradeAssinaturas signatarios={signatarios} assinaturasPorId={assinaturasPorId} />
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
