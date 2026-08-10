import type { Papel } from "@/lib/supabase/database.types";

export type NavLeaf = {
  href: string;
  label: string;
  // Se definido, só esses papéis veem o item — senão, todo autenticado vê.
  apenas?: Papel[];
  // Papéis pra quem esse item específico fica escondido (usado no lugar
  // de "apenas" quando é mais fácil listar exceção do que lista fechada).
  oculto?: Papel[];
  // Contador (ex.: pendências aguardando esse usuário) — calculado por
  // requisição, não faz parte de NAV_ESTRUTURA; injetado depois de
  // filtrarNav (ver src/app/(app)/layout.tsx).
  badge?: number;
};
export type NavGroup = { label: string; items: NavLeaf[] };
export type NavEntry = NavLeaf | NavGroup;

export const NAV_ESTRUTURA: NavEntry[] = [
  { href: "/dashboard", label: "Painel" },
  { href: "/relatorios/anual", label: "Relatório Anual" },
  { href: "/agenda", label: "Agenda" },
  { href: "/mensagens", label: "Mensagens" },
  {
    label: "Diárias e Reembolsos",
    items: [
      { href: "/diarias", label: "Diárias", oculto: ["estagiario"] },
      { href: "/diarias?prestacao=pendente", label: "Prestações de Contas", oculto: ["estagiario"] },
      { href: "/requerimentos", label: "Reembolsos", oculto: ["estagiario"] },
      { href: "/veiculos", label: "Veículos", oculto: ["servidor", "estagiario"] },
    ],
  },
  {
    label: "Secretaria",
    items: [
      { href: "/decretos", label: "Decretos" },
      { href: "/oficios", label: "Ofícios" },
      { href: "/legislacao", label: "Legislação" },
      { href: "/plenario", label: "Sessão do Plenário", apenas: ["admin", "ordenador_despesa"] },
    ],
  },
  {
    label: "Recursos Humanos",
    items: [
      { href: "/requerimentos-internos", label: "Requerimentos Internos" },
      { href: "/avaliacoes", label: "Avaliações", oculto: ["servidor", "gestor_diarias", "estagiario"] },
    ],
  },
  {
    label: "Configurações",
    items: [
      { href: "/pessoas", label: "Pessoas", oculto: ["servidor", "gestor_diarias", "estagiario"] },
      { href: "/autoridades", label: "Autoridades", oculto: ["servidor", "gestor_diarias", "estagiario"] },
      { href: "/usuarios", label: "Usuários", apenas: ["admin"] },
    ],
  },
  { href: "/auditoria", label: "Auditoria", apenas: ["admin"] },
];

export function podeVer(item: NavLeaf, papel: Papel | undefined) {
  if (item.apenas) return Boolean(papel && item.apenas.includes(papel));
  if (item.oculto) return !papel || !item.oculto.includes(papel);
  return true;
}

// Filtra cada item (folha ou dentro de grupo) pelo papel do usuário — e
// remove grupos que ficaram sem nenhum item visível.
export function filtrarNav(estrutura: NavEntry[], papel: Papel | undefined): NavEntry[] {
  const resultado: NavEntry[] = [];
  for (const item of estrutura) {
    if ("items" in item) {
      const visiveis = item.items.filter((sub) => podeVer(sub, papel));
      if (visiveis.length > 0) resultado.push({ label: item.label, items: visiveis });
    } else if (podeVer(item, papel)) {
      resultado.push(item);
    }
  }
  return resultado;
}
