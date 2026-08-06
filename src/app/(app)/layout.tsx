import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { buscarPendenciasPrestacaoContas } from "@/lib/dashboard/pendencias";
import { AppShell } from "./app-shell";
import { NAV_ESTRUTURA, filtrarNav, type NavEntry } from "@/lib/nav";
export type { NavEntry } from "@/lib/nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getCurrentUsuario();
  const navItems = filtrarNav(NAV_ESTRUTURA, usuario?.papel);

  const supabase = await createClient();
  const pendencias = await buscarPendenciasPrestacaoContas(supabase, usuario?.papel);

  // Contador de pendências (aprovação/baixa/parecer) no item "Painel" — só
  // quem tem alguma dessas etapas pra decidir enxerga o número.
  const navComBadge: NavEntry[] =
    pendencias.total > 0
      ? navItems.map((item) =>
          "items" in item || item.href !== "/dashboard"
            ? item
            : { ...item, badge: pendencias.total },
        )
      : navItems;

  return (
    <AppShell usuario={usuario} navItems={navComBadge}>
      {children}
    </AppShell>
  );
}
