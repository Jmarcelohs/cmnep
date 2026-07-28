import type { ConceitoAvaliacao, ItemAvaliacaoLancado } from "@/lib/supabase/database.types";
import type { AvaliacaoTemplate } from "./templates";

export interface ResumoAvaliacao {
  // linhas = critério, colunas = conceito (§2.3 do formulário)
  porCriterio: Record<string, Record<ConceitoAvaliacao, number>>;
  // linha "Total dos Conceitos"
  totalPorConceito: Record<ConceitoAvaliacao, number>;
  // pontos = total do conceito × peso (§2.4)
  pontosPorConceito: Record<ConceitoAvaliacao, number>;
  notaFinal: number;
}

export function totalItensTemplate(template: AvaliacaoTemplate): number {
  return template.criterios.reduce((soma, criterio) => soma + criterio.itens.length, 0);
}

// Garante uma marcação por item do template, sem duplicata e sem item
// de fora do template — lançado antes de gravar (actions.ts) e antes de
// calcular o resumo, pra não deixar a nota sair errada silenciosamente.
export function validarItens(itens: ItemAvaliacaoLancado[], template: AvaliacaoTemplate): string[] {
  const erros: string[] = [];
  const vistos = new Set<string>();

  for (const item of itens) {
    const chave = `${item.criterio}-${item.numero}`;
    if (vistos.has(chave)) {
      erros.push(`Item ${chave} marcado mais de uma vez.`);
    }
    vistos.add(chave);
  }

  for (const criterio of template.criterios) {
    for (const itemTemplate of criterio.itens) {
      const chave = `${criterio.key}-${itemTemplate.numero}`;
      if (!vistos.has(chave)) {
        erros.push(`Item ${chave} (${criterio.nome} — ${itemTemplate.texto}) não foi avaliado.`);
      }
    }
  }

  return erros;
}

export function calcularResumo(itens: ItemAvaliacaoLancado[], template: AvaliacaoTemplate): ResumoAvaliacao {
  const porCriterio: ResumoAvaliacao["porCriterio"] = {};
  const totalPorConceito = criarMapaConceitosZerado(template);

  for (const criterio of template.criterios) {
    porCriterio[criterio.key] = criarMapaConceitosZerado(template);
  }

  for (const item of itens) {
    const linha = porCriterio[item.criterio];
    if (!linha || !(item.conceito in totalPorConceito)) continue;
    linha[item.conceito] += 1;
    totalPorConceito[item.conceito] += 1;
  }

  const pontosPorConceito = criarMapaConceitosZerado(template);
  let notaFinal = 0;
  for (const conceito of template.conceitos) {
    const pontos = totalPorConceito[conceito.key] * conceito.peso;
    pontosPorConceito[conceito.key] = pontos;
    notaFinal += pontos;
  }

  return { porCriterio, totalPorConceito, pontosPorConceito, notaFinal };
}

function criarMapaConceitosZerado(template: AvaliacaoTemplate): Record<ConceitoAvaliacao, number> {
  const mapa = {} as Record<ConceitoAvaliacao, number>;
  for (const conceito of template.conceitos) {
    mapa[conceito.key] = 0;
  }
  return mapa;
}
