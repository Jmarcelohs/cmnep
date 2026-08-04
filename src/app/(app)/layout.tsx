import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { AppShell } from "./app-shell";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Painel" },
  { href: "/diarias", label: "Diárias de Viagem" },
  { href: "/requerimentos-internos", label: "Requerimentos Internos" },
  { href: "/requerimentos", label: "Reembolso" },
  { href: "/veiculos", label: "Veículos" },
  { href: "/decretos", label: "Decretos" },
  { href: "/pessoas", label: "Pessoas" },
  { href: "/avaliacoes", label: "Avaliações" },
];

const NAV_ITEMS_ADMIN = [
  { href: "/usuarios", label: "Usuários" },
  { href: "/auditoria", label: "Auditoria" },
];

// Abas que servidor não precisa ver — não são do dia a dia dele
// (gestão de pessoas, avaliações e veículos são operadas por
// ordenador da despesa/admin).
const HREFS_OCULTOS_SERVIDOR = ["/pessoas", "/avaliacoes", "/veiculos"];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getCurrentUsuario();
  const itensBase =
    usuario?.papel === "servidor"
      ? NAV_ITEMS.filter((item) => !HREFS_OCULTOS_SERVIDOR.includes(item.href))
      : NAV_ITEMS;
  const navItems = [...itensBase, ...(usuario?.papel === "admin" ? NAV_ITEMS_ADMIN : [])];

  return (
    <AppShell usuario={usuario} navItems={navItems}>
      {children}
    </AppShell>
  );
}
