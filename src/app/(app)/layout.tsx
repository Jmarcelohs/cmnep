import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { buscarPendenciasPrestacaoContas } from "@/lib/dashboard/pendencias";
import { buscarMensagensNaoLidas } from "@/lib/mensagens/nao-lidas";
import { AppShell } from "./app-shell";
import { ChatProvider } from "./chat-provider";
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
  const [pendencias, mensagensNaoLidas] = await Promise.all([
    buscarPendenciasPrestacaoContas(supabase, usuario),
    buscarMensagensNaoLidas(supabase, usuario),
  ]);

  // Contador por item de topo: pendências (aprovação/baixa/parecer) no
  // "Painel", mensagens não lidas em "Mensagens" — cada um só aparece pra
  // quem tem algo pendente/não lido.
  const badgesPorHref: Record<string, number> = {
    "/dashboard": pendencias.total,
    "/mensagens": mensagensNaoLidas.total,
  };

  const navComBadge: NavEntry[] = navItems.map((item) => {
    if ("items" in item) return item;
    const badge = badgesPorHref[item.href];
    return badge ? { ...item, badge } : item;
  });

  return (
    <ChatProvider usuarioId={usuario?.id} totalNaoLidasInicial={mensagensNaoLidas.total}>
      <AppShell usuario={usuario} navItems={navComBadge}>
        {children}
      </AppShell>
    </ChatProvider>
  );
}
