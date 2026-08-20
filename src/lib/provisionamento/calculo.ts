import { formatarData } from "@/lib/pdf/formato";
import type { Contrato } from "./tipos";

// Converte "YYYY-MM-DD" num inteiro ano*12+mês(0-11) — permite comparar
// duas competências (ano/mês) com aritmética simples, sem lidar com Date
// e fuso horário. O dia do mês nunca entra na conta: todo o cálculo deste
// módulo trabalha em granularidade mensal (ver "3. Lógica de cálculo" no
// Memorial de Cálculo).
function competencia(dataISO: string): number {
  const [ano, mes] = dataISO.split("-").map(Number);
  return ano * 12 + (mes - 1);
}

// Quantos aniversários anuais da data de reajuste já ocorreram até o mês
// em análise, inclusive. Se a data de reajuste cadastrada já estiver no
// passado em relação ao mês analisado, os aniversários intermediários
// também contam (cadência anual completa, não só o próximo reajuste
// isolado) — ver item 3 do Memorial de Cálculo.
export function contarAniversariosReajuste(
  dataProximoReajusteISO: string,
  ano: number,
  mes: number,
): number {
  const alvo = ano * 12 + (mes - 1);
  const ancora = competencia(dataProximoReajusteISO);
  if (alvo < ancora) return 0;
  return Math.floor((alvo - ancora) / 12) + 1;
}

// Valor provisionado de um contrato num mês específico do ano de
// referência — implementa os passos 1-4 do Memorial de Cálculo, nessa
// ordem: fora da vigência inicial → fim de vigência (continua/vence/nova
// licitação) → reajuste composto.
export function valorMensalContrato(contrato: Contrato, ano: number, mes: number): number {
  const alvo = ano * 12 + (mes - 1);
  const inicioVigencia = competencia(contrato.dataInicioVigencia);
  const fimVigencia = competencia(contrato.dataFimVigencia);

  if (alvo < inicioVigencia) return 0;

  if (alvo > fimVigencia) {
    if (contrato.situacao === "continua") {
      // Ignora o fim de vigência cadastrado — cai pro cálculo de reajuste
      // normal abaixo, como se o contrato seguisse vigente.
    } else if (
      contrato.situacao === "nova_licitacao" &&
      contrato.valorNovoContratoEstimado != null &&
      contrato.dataInicioNovoContrato &&
      alvo >= competencia(contrato.dataInicioNovoContrato)
    ) {
      return contrato.valorNovoContratoEstimado;
    } else {
      return 0;
    }
  }

  const valorBase = contrato.tipoValor === "anual" ? contrato.valorVigente / 12 : contrato.valorVigente;
  const n = contarAniversariosReajuste(contrato.dataProximoReajuste, ano, mes);
  return valorBase * Math.pow(1 + contrato.percentualEstimado, n);
}

export function provisionamentoMensalContrato(contrato: Contrato, ano: number): number[] {
  return Array.from({ length: 12 }, (_, i) => valorMensalContrato(contrato, ano, i + 1));
}

export function totalAnualContrato(contrato: Contrato, ano: number): number {
  return provisionamentoMensalContrato(contrato, ano).reduce((soma, v) => soma + v, 0);
}

export type GrupoDotacao = {
  chave: string;
  contratos: Contrato[];
  totalPorMes: number[];
  totalAnual: number;
};

// Agrupa pela ficha orçamentária informada — cai pra dotação quando a
// ficha estiver vazia (ver "4. Consolidação por dotação/ficha
// orçamentária" no Memorial de Cálculo).
export function consolidarPorDotacao(contratos: Contrato[], ano: number): GrupoDotacao[] {
  const grupos = new Map<string, Contrato[]>();
  for (const contrato of contratos) {
    const chave = contrato.fichaOrcamentaria.trim() || contrato.dotacao.trim() || "(sem ficha/dotação)";
    if (!grupos.has(chave)) grupos.set(chave, []);
    grupos.get(chave)!.push(contrato);
  }

  return Array.from(grupos.entries())
    .map(([chave, contratosDoGrupo]) => {
      const totalPorMes = Array.from({ length: 12 }, (_, i) =>
        contratosDoGrupo.reduce((soma, c) => soma + valorMensalContrato(c, ano, i + 1), 0),
      );
      return {
        chave,
        contratos: contratosDoGrupo,
        totalPorMes,
        totalAnual: totalPorMes.reduce((soma, v) => soma + v, 0),
      };
    })
    .sort((a, b) => a.chave.localeCompare(b.chave, "pt-BR"));
}

export type Alerta = {
  contratoId: string;
  tipo: "sem_renovacao" | "nova_licitacao";
  mensagem: string;
};

// Ver "5. Alertas gerados automaticamente" no Memorial de Cálculo.
export function gerarAlertas(contratos: Contrato[], ano: number): Alerta[] {
  const inicioAno = ano * 12;
  const fimAno = ano * 12 + 11;
  const alertas: Alerta[] = [];

  for (const contrato of contratos) {
    const identificador = contrato.nome || "Contrato sem nome";
    const fichaOuDotacao = contrato.fichaOrcamentaria.trim() || contrato.dotacao.trim() || "não informada";

    if (contrato.situacao === "vence") {
      const fimVigencia = competencia(contrato.dataFimVigencia);
      if (fimVigencia >= inicioAno && fimVigencia <= fimAno) {
        alertas.push({
          contratoId: contrato.id,
          tipo: "sem_renovacao",
          mensagem: `"${identificador}" vence em ${formatarData(contrato.dataFimVigencia)} sem previsão de renovação — a ficha ${fichaOuDotacao} fica sem previsão a partir do mês seguinte.`,
        });
      }
    } else if (contrato.situacao === "nova_licitacao") {
      alertas.push({
        contratoId: contrato.id,
        tipo: "nova_licitacao",
        mensagem: `"${identificador}" está em processo de nova licitação (vigência atual até ${formatarData(contrato.dataFimVigencia)}) — confirme o valor estimado do novo contrato.`,
      });
    }
  }

  return alertas;
}
