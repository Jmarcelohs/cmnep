"use client";

import { useChatPresenca } from "@/app/(app)/chat-provider";

export function IndicadorOnline({ usuarioId }: { usuarioId: string }) {
  const { usuariosOnline } = useChatPresenca();
  const online = usuariosOnline.has(usuarioId);

  return (
    <span
      title={online ? "Online" : "Offline"}
      className={`inline-block h-2 w-2 shrink-0 rounded-full ${online ? "bg-emerald-500" : "bg-slate-300"}`}
    />
  );
}
