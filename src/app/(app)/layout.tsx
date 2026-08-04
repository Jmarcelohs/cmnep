import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { AppShell } from "./app-shell";
import { NAV_ESTRUTURA, filtrarNav } from "@/lib/nav";
export type { NavEntry } from "@/lib/nav";

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
