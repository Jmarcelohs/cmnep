import { PaginaA4 } from "../celula";
import { dataPorExtenso, formatarData, formatarMoeda } from "@/lib/pdf/formato";
import { corpoRequerimentoInterno, NOME_CAMARA, paragrafoDecisao, PRESIDENTE } from "@/lib/requerimentos-internos/documento";
import type {
  CargoDeclarado,
  DecisaoRequerimentoInterno,
  StatusRequerimentoInterno,
  TipoRequerimentoInterno,
} from "@/lib/supabase/database.types";

type Requerimento = {
  numero: string;
  ano: number;
  tipo: TipoRequerimentoInterno;
  nome: string;
  cargo: CargoDeclarado;
  cpf: string | null;
  matricula: string | null;
  data_requerimento: string;
  assunto_key: string | null;
  assunto: string;
  fundamento: string | null;
  campos: Record<string, string>;
  pedido: string | null;
  referente_a: string | null;
  valor: number | null;
  status: StatusRequerimentoInterno;
  decisao: DecisaoRequerimentoInterno | null;
  decisao_data: string | null;
};

const CARGOS: CargoDeclarado[] = ["Vereador(a)", "Servidor(a)", "Estagiário(a)"];

function Checkbox({ marcado, label }: { marcado: boolean; label: string }) {
  return (
    <span className="mr-4 font-bold">
      <span className="inline-block w-[4mm] border border-black text-center">
        {marcado ? "X" : ""}
      </span>{" "}
      {label}
    </span>
  );
}

export function RequerimentoInternoConteudo({
  requerimento,
  quebrarPagina = true,
}: {
  requerimento: Requerimento;
  quebrarPagina?: boolean;
}) {
  const corpo = corpoRequerimentoInterno({
    tipo: requerimento.tipo,
    assuntoKey: requerimento.assunto_key,
    nome: requerimento.nome,
    cargo: requerimento.cargo,
    cpf: requerimento.cpf,
    matricula: requerimento.matricula,
    fundamento: requerimento.fundamento,
    campos: requerimento.campos,
    pedido: requerimento.pedido,
  });

  return (
    <PaginaA4 quebrarPagina={quebrarPagina}>
      <div className="ml-[30mm] mr-[20mm] mt-[32mm] mb-[26mm] flex flex-1 flex-col text-[12pt] leading-relaxed">
        <p className="text-center text-[13pt] font-bold">REQUERIMENTO</p>
        <p className="mt-1 text-center text-[11pt] font-bold uppercase">{requerimento.assunto}</p>
        <p className="mt-1 text-center text-[9pt] text-slate-500">
          Nº {requerimento.numero}/{requerimento.ano}
        </p>

        <p className="mt-4 text-center">
          {CARGOS.map((c) => (
            <Checkbox key={c} marcado={requerimento.cargo === c} label={c} />
          ))}
        </p>

        <div className="mt-4 space-y-1">
          <p>
            <span className="font-bold">Data do Requerimento:</span>{" "}
            {formatarData(requerimento.data_requerimento)}
          </p>
          <p>
            <span className="font-bold">CPF:</span> {requerimento.cpf ?? "—"}
          </p>
          {requerimento.matricula && (
            <p>
              <span className="font-bold">Matrícula:</span> {requerimento.matricula}
            </p>
          )}
          {requerimento.fundamento && (
            <p>
              <span className="font-bold">Fundamento:</span> {requerimento.fundamento}
            </p>
          )}
          {requerimento.valor != null && (
            <p>
              <span className="font-bold">Valor:</span> {formatarMoeda(requerimento.valor)}
            </p>
          )}
        </div>

        <p className="mt-4 indent-[1.25cm] text-justify">{corpo}</p>

        {requerimento.referente_a && (
          <p className="mt-3 indent-[1.25cm] text-justify">
            <span className="font-bold">Referente à:</span> {requerimento.referente_a}
          </p>
        )}

        <div className="mt-[16mm] text-center">
          <div className="mx-auto w-[90mm] border-t border-black pt-1">
            <p className="font-bold">{requerimento.nome}</p>
            <p>
              {requerimento.cargo} – CPF: {requerimento.cpf ?? "—"}
            </p>
            {requerimento.matricula && <p>Matrícula: {requerimento.matricula}</p>}
          </div>
        </div>

        <div className="mt-[14mm] border-t border-black pt-3">
          <p className="indent-[1.25cm] text-justify">
            {paragrafoDecisao({ decisao: requerimento.decisao, fundamento: requerimento.fundamento })}
          </p>
          <p className="mt-4 text-right">
            Nepomuceno, {dataPorExtenso(requerimento.decisao_data ?? requerimento.data_requerimento)}.
          </p>
          <div className="mx-auto mt-[20mm] w-[90mm] border-t border-black pt-1 text-center">
            <p className="font-bold">{PRESIDENTE}</p>
            <p>Presidente da {NOME_CAMARA}</p>
          </div>
        </div>
      </div>
    </PaginaA4>
  );
}
