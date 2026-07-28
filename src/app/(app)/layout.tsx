import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { AppShell } from "./app-shell";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Painel" },
  { href: "/diarias", label: "Diárias de Viagem" },
  { href: "/requerimentos-internos", label: "Requerimentos Internos" },
  { href: "/requerimentos", label: "Reembolso" },
  { href: "/veiculos", label: "Veículos" },
  { href: "/pessoas", label: "Pessoas" },
  { href: "/avaliacoes", label: "Avaliações" },
];

const NAV_ITEM_ADMIN = { href: "/usuarios", label: "Usuários" };

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getCurrentUsuario();
  const navItems = [...NAV_ITEMS, ...(usuario?.papel === "admin" ? [NAV_ITEM_ADMIN] : [])];

  return (
    <AppShell usuario={usuario} navItems={navItems}>
      {children}
    </AppShell>
  );
}
