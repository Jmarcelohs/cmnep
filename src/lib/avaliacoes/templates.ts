import type { ConceitoAvaliacao } from "@/lib/supabase/database.types";
import { TEMPLATE_ESTAGIO_PROBATORIO } from "./template-estagio-probatorio";

export interface ItemTemplate {
  numero: number;
  texto: string;
}

export interface CriterioTemplate {
  key: string;
  nome: string;
  definicao: string;
  escala?: string;
  itens: ItemTemplate[];
}

export interface ConceitoDef {
  key: ConceitoAvaliacao;
  label: string;
  peso: number;
}

export interface AvaliacaoTemplate {
  id: string;
  nome: string;
  criterios: CriterioTemplate[];
  conceitos: ConceitoDef[];
}

// Um segundo template (ex.: ciclo trimestral/anual regular, se vier a
// ser diferente do de estágio probatório) só precisa de um novo arquivo
// irmão de template-estagio-probatorio.ts + uma entrada aqui, desde que
// seus itens caibam na mesma forma {criterio, numero, conceito}.
const TEMPLATES: Record<string, AvaliacaoTemplate> = {
  [TEMPLATE_ESTAGIO_PROBATORIO.id]: TEMPLATE_ESTAGIO_PROBATORIO,
};

export function getTemplate(id: string): AvaliacaoTemplate {
  const template = TEMPLATES[id];
  if (!template) {
    throw new Error(`Template de avaliação desconhecido: ${id}`);
  }
  return template;
}

export function listarTemplates(): AvaliacaoTemplate[] {
  return Object.values(TEMPLATES);
}
