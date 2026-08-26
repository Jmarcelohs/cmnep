import { dataPorExtenso, formatarMoeda } from "@/lib/pdf/formato";
import { valorPorExtensoMinusculo } from "@/lib/suplementacoes/documento";
import { DIRETORA_TESOURARIA } from "./documento-comum";
import type { Processo } from "./tipos";

// Valores-limite do art. 75, §1º, incisos I e II da Lei 14.133/2021
// (dispensa em razão de valor), atualizados periodicamente por decreto
// federal — os vigentes aqui são os do Decreto Federal nº 12.807, de
// 29/12/2025 (modelo real usado de referência, 08/2026). ATUALIZAR estes
// 3 valores quando um novo decreto de atualização for publicado —
// diferente de MESA_DIRETORA, este NÃO deve ficar congelado no valor
// antigo, já que a certidão sempre precisa citar o limite vigente na
// data de emissão, não o de quando este código foi escrito.
const LIMITE_INCISO_I = 130_984.2;
const LIMITE_INCISO_II = 65_492.11;
const DECRETO_ATUALIZACAO = "12.807, de 29 de dezembro de 2025";

// Corpo completo da Certidão de Valor — assinada pela Diretoria de
// Tesouraria e Financeiro, certificando que o somatório das contratações
// de mesma natureza no exercício não ultrapassa os limites de dispensa
// por valor. Só se aplica de fato a processos de dispensa (é exatamente
// o art. 75 que fundamenta essa modalidade); para as demais, fica um
// texto genérico editável — mesmo padrão já usado no TR pra fundamentação
// específica de modalidade (ver documento-tr.ts).
export function montarCorpoCertidaoValor({ processo }: { processo: Processo }): string {
  const certificacao =
    processo.modalidade === "dispensa"
      ? `<p>O Setor de Contratações Públicas da Câmara Municipal de Nepomuceno, para os devidos fins, em cumprimento ao §1º do art. 75 da Lei 14.133/2021, CERTIFICA que, o somatório das contratações, no presente exercício financeiro, referente aos objetos de mesma natureza a serem contratados no presente procedimento de dispensa, NÃO ultrapassa o limite estabelecido no art. 75, §1º, incisos I e II da Lei 14.133/2021, atualizado pelo Decreto Federal nº ${DECRETO_ATUALIZACAO}, ou seja, não ultrapassa os valores de ${formatarMoeda(LIMITE_INCISO_I)} (${valorPorExtensoMinusculo(LIMITE_INCISO_I)}) e de ${formatarMoeda(LIMITE_INCISO_II)} (${valorPorExtensoMinusculo(LIMITE_INCISO_II)}), respectivamente.</p>`
      : `<p>[A Certidão de Valor certifica o limite de dispensa por valor (art. 75, §1º da Lei 14.133/2021) — ajuste ou substitua este texto pela fundamentação aplicável a esta modalidade antes de imprimir.]</p>`;

  return `<p style="text-align:center;font-size:18pt"><strong>CERTIDÃO</strong></p>

<p><strong>Objeto do Processo Administrativo</strong>: ${processo.objeto}</p>

${certificacao}

<p style="text-align:right">Nepomuceno, Minas Gerais, ${dataPorExtenso(processo.dataAbertura)}.</p>

<p style="text-align:center">${DIRETORA_TESOURARIA.nome}<br />${DIRETORA_TESOURARIA.cargo}</p>`;
}
