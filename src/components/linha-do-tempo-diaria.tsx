import { formatarData } from "@/lib/pdf/formato";
import type { StatusDiaria } from "@/lib/supabase/database.types";

type Solicitacao = {
  status: StatusDiaria;
  data_solicitacao: string | null;
  data_autorizacao: string | null;
};

type Prestacao = {
  data_autenticacao_beneficiario: string | null;
  data_aprovacao_ordenador: string | null;
  data_baixa: string | null;
  parecer_data: string | null;
} | null;

type Etapa = { rotulo: string; data: string | null; concluida: boolean };

export function LinhaDoTempoDiaria({
  solicitacao,
  prestacao,
}: {
  solicitacao: Solicitacao;
  prestacao: Prestacao;
}) {
  const etapas: Etapa[] = [
    { rotulo: "Solicitado", data: solicitacao.data_solicitacao, concluida: true },
  ];

  if (solicitacao.status === "Indeferido") {
    etapas.push({ rotulo: "Indeferido", data: null, concluida: true });
  } else {
    etapas.push({
      rotulo: "Autorizado",
      data: solicitacao.data_autorizacao,
      concluida: solicitacao.status === "Autorizado",
    });
    etapas.push({
      rotulo: "Prestação de contas enviada",
      data: prestacao?.data_autenticacao_beneficiario ?? null,
      concluida: Boolean(prestacao?.data_autenticacao_beneficiario),
    });
    etapas.push({
      rotulo: "Aprovação do ordenador da despesa",
      data: prestacao?.data_aprovacao_ordenador ?? null,
      concluida: Boolean(prestacao?.data_aprovacao_ordenador),
    });
    etapas.push({
      rotulo: "Baixa do pagamento",
      data: prestacao?.data_baixa ?? null,
      concluida: Boolean(prestacao?.data_baixa),
    });
    etapas.push({
      rotulo: "Parecer do Controle Interno",
      data: prestacao?.parecer_data ?? null,
      concluida: Boolean(prestacao?.parecer_data),
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-slate-900">Linha do tempo</h2>
      <ol className="mt-3">
        {etapas.map((etapa, indice) => (
          <li key={etapa.rotulo} className="relative flex gap-3 pb-5 last:pb-0">
            {indice < etapas.length - 1 && (
              <span
                className={`absolute top-3 left-[5px] h-full w-px ${
                  etapa.concluida ? "bg-brand-navy/40" : "bg-slate-200"
                }`}
              />
            )}
            <span
              className={`z-10 mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2 ${
                etapa.concluida
                  ? "border-brand-navy bg-brand-navy"
                  : "border-slate-300 bg-white"
              }`}
            />
            <div className="flex-1">
              <p className={`text-sm font-medium ${etapa.concluida ? "text-slate-900" : "text-slate-400"}`}>
                {etapa.rotulo}
              </p>
              <p className="text-xs text-slate-500">
                {etapa.concluida ? formatarData(etapa.data) : "Pendente"}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
