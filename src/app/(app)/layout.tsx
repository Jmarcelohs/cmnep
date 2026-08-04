import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { AppShell } from "./app-shell";
import type { Papel } from "@/lib/supabase/database.types";

type NavLeaf = {
  href: string;
  label: string;
  // Se definido, só esses papéis veem o item — senão, todo autenticado vê.
  apenas?: Papel[];
  // Papéis pra quem esse item específico fica escondido (usado no lugar
  // de "apenas" quando é mais fácil listar exceção do que lista fechada).
  oculto?: Papel[];
};
type NavGroup = { label: string; items: NavLeaf[] };
export type NavEntry = NavLeaf | NavGroup;

const NAV_ESTRUTURA: NavEntry[] = [
  { href: "/dashboard", label: "Painel" },
  {
    label: "Diárias e Reembolsos",
    items: [
      { href: "/diarias", label: "Diárias" },
      { href: "/diarias?prestacao=pendente", label: "Prestações de Contas" },
      { href: "/requerimentos", label: "Reembolsos" },
      { href: "/veiculos", label: "Veículos", oculto: ["servidor"] },
    ],
  },
  {
    label: "Secretaria",
    items: [{ href: "/decretos", label: "Decretos" }],
  },
  {
    label: "Recursos Humanos",
    items: [
      { href: "/requerimentos-internos", label: "Requerimentos Internos" },
      { href: "/avaliacoes", label: "Avaliações", oculto: ["servidor", "gestor_diarias"] },
    ],
  },
  {
    label: "Configurações",
    items: [
      { href: "/pessoas", label: "Pessoas", oculto: ["servidor", "gestor_diarias"] },
      { href: "/usuarios", label: "Usuários", apenas: ["admin"] },
    ],
  },
  { href: "/auditoria", label: "Auditoria", apenas: ["admin"] },
];

function podeVer(item: NavLeaf, papel: Papel | undefined) {
  if (item.apenas) return Boolean(papel && item.apenas.includes(papel));
  if (item.oculto) return !papel || !item.oculto.includes(papel);
  return true;
}

// Filtra cada item (folha ou dentro de grupo) pelo papel do usuário — e
// remove grupos que ficaram sem nenhum item visível.
function filtrarNav(estrutura: NavEntry[], papel: Papel | undefined): NavEntry[] {
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

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getCurrentUsuario();
  const navItems = filtrarNav(NAV_ESTRUTURA, usuario?.papel);

  return (
    <AppShell usuario={usuario} navItems={navItems}>
      {children}
    </AppShell>
  );
}
