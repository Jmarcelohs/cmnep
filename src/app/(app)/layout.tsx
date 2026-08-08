import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { buscarPendenciasPrestacaoContas } from "@/lib/dashboard/pendencias";
import { buscarDiariasAtrasadas } from "@/lib/dashboard/diarias-atrasadas";
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
  const [pendencias, diariasAtrasadas, mensagensNaoLidas] = await Promise.all([
    buscarPendenciasPrestacaoContas(supabase, usuario),
    buscarDiariasAtrasadas(supabase, usuario),
    buscarMensagensNaoLidas(supabase, usuario),
  ]);

  // Contador por item de topo: pendências (aprovação/baixa/parecer) no
  // "Painel", diárias com prestação de contas atrasada em "Prestações de
  // Contas", mensagens não lidas em "Mensagens" — cada um só aparece pra
  // quem tem algo pendente/atrasado/não lido.
  const badgesPorHref: Record<string, number> = {
    "/dashboard": pendencias.total,
    "/diarias?prestacao=pendente": diariasAtrasadas.total,
    "/mensagens": mensagensNaoLidas.total,
  };

  function comBadge<T extends { href: string }>(item: T): T & { badge?: number } {
    const badge = badgesPorHref[item.href];
    return badge ? { ...item, badge } : item;
  }

  const navComBadge: NavEntry[] = navItems.map((item) =>
    "items" in item ? { ...item, items: item.items.map(comBadge) } : comBadge(item),
  );

  return (
    <ChatProvider usuarioId={usuario?.id} totalNaoLidasInicial={mensagensNaoLidas.total}>
      <AppShell usuario={usuario} navItems={navComBadge}>
        {children}
      </AppShell>
    </ChatProvider>
  );
}
