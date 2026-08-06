import type { createClient } from "@/lib/supabase/server";

export type MensagensNaoLidas = { total: number };

// Mesmo padrão de src/lib/dashboard/pendencias.ts: recalculado a cada
// navegação (sem realtime) — só a conversa aberta é live, ver
// src/app/(app)/mensagens/[usuarioId]/mensagem-thread.tsx.
export async function buscarMensagensNaoLidas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  usuario: { id: string } | null | undefined,
): Promise<MensagensNaoLidas> {
  if (!usuario) return { total: 0 };

  const { count } = await supabase
    .from("mensagens_diretas")
    .select("id", { count: "exact", head: true })
    .eq("destinatario_id", usuario.id)
    .eq("lida", false);

  return { total: count ?? 0 };
}
