import { formatarData, formatarMoeda, valorPorExtenso } from "@/lib/pdf/formato";
import type { SubassuntoReembolso } from "@/lib/supabase/database.types";

export const FUNDAMENTO_REEMBOLSO = "Art. 9º, da Resolução nº 40 de 04 de abril de 2023";

export const PRESIDENTE_PADRAO = "Tullio Ian Marangoni de Morais";

export const SUBASSUNTO_LABEL: Record<SubassuntoReembolso, string> = {
  locomocao: "locomoção urbana (Uber, táxi e outros)",
  combustivel: "combustível e estacionamento",
  passagem_aerea: "passagem aérea",
  passagem_onibus: "passagem de ônibus",
};

export const SUBASSUNTO_TITULO: Record<SubassuntoReembolso, string> = {
  locomocao: "Locomoção Urbana (Uber, Táxi e outros)",
  combustivel: "Despesas com Combustível e Estacionamento",
  passagem_aerea: "Passagens Aéreas",
  passagem_onibus: "Passagens de Ônibus",
};

export function buildReferenteA(subassunto: SubassuntoReembolso) {
  return `Reembolso de Despesas — ${SUBASSUNTO_LABEL[subassunto]}`;
}

export function corpoReembolso({
  nome,
  cargoDeclarado,
  cpf,
  subassunto,
  dataIda,
  dataVolta,
  municipio,
  valor,
  placaVeiculo,
  modeloVeiculo,
}: {
  nome: string;
  cargoDeclarado: string;
  cpf: string | null;
  subassunto: SubassuntoReembolso;
  dataIda: string | null;
  dataVolta: string | null;
  municipio: string;
  valor: number;
  placaVeiculo?: string | null;
  modeloVeiculo?: string | null;
}) {
  const nomeTexto = nome || "[solicitante]";
  const municipioTexto = municipio || "[município]";

  // Reembolso de combustível/estacionamento identifica o veículo
  // utilizado (placa e modelo) direto no corpo do requerimento.
  const clausulaVeiculo =
    subassunto === "combustivel" && (placaVeiculo || modeloVeiculo)
      ? `, utilizando o veículo locado pela Câmara Municipal de Nepomuceno, placa ${placaVeiculo || "—"}, modelo ${modeloVeiculo || "—"},`
      : ",";

  return (
    `${nomeTexto}, ${cargoDeclarado}, portador(a) do CPF nº ${cpf ?? "—"}, vem respeitosamente ` +
    `requerer a Vossa Excelência, com fundamento no ${FUNDAMENTO_REEMBOLSO}, o reembolso de ` +
    `${SUBASSUNTO_LABEL[subassunto]}${clausulaVeiculo} referentes à viagem ao município de ${municipioTexto}, ` +
    `realizada no período de ${formatarData(dataIda)} a ${formatarData(dataVolta)}, no valor de ` +
    `${formatarMoeda(valor)} (${valorPorExtenso(valor)}), solicitando o pagamento pelos meios de praxe.`
  );
}
