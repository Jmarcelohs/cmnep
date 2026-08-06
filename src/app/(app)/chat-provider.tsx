"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Toast = { id: string; usuarioId: string; nome: string; preview: string };

type ChatContexto = {
  usuariosOnline: Set<string>;
  totalNaoLidas: number;
  marcarLidas: (quantidade: number) => void;
};

const ChatContext = createContext<ChatContexto>({
  usuariosOnline: new Set(),
  totalNaoLidas: 0,
  marcarLidas: () => {},
});

export function useChatPresenca() {
  return useContext(ChatContext);
}

// Janela de "online": se não avisou nos últimos 30s (o dobro do intervalo
// de heartbeat), considera offline.
const JANELA_ONLINE_MS = 30_000;
const INTERVALO_POLL_MS = 15_000;

export function ChatProvider({
  usuarioId,
  totalNaoLidasInicial,
  children,
}: {
  usuarioId: string | undefined;
  totalNaoLidasInicial: number;
  children: React.ReactNode;
}) {
  const [supabase] = useState(() => createClient());
  const [usuariosOnline, setUsuariosOnline] = useState<Set<string>>(new Set());
  const [totalNaoLidas, setTotalNaoLidas] = useState(totalNaoLidasInicial);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const router = useRouter();
  const nomesCache = useRef(new Map<string, string>());

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!usuarioId) return;

    let cancelado = false;
    // Só notifica mensagens com criado_em depois desse instante — evita
    // reexibir toast de mensagens não lidas que já existiam ao abrir a
    // página (essas já aparecem no badge, sem precisar de toast).
    let ultimoPoll = new Date().toISOString();

    async function poll() {
      const agora = new Date();

      // Heartbeat — avisa que esse navegador ainda está ativo.
      await supabase
        .from("presenca_usuarios")
        .upsert({ usuario_id: usuarioId!, ultima_atividade: agora.toISOString() });
      if (cancelado) return;

      // Quem mais avisou atividade recentemente.
      const { data: online } = await supabase
        .from("presenca_usuarios")
        .select("usuario_id")
        .gte("ultima_atividade", new Date(agora.getTime() - JANELA_ONLINE_MS).toISOString());
      if (cancelado) return;
      setUsuariosOnline(new Set((online ?? []).map((o) => o.usuario_id)));

      // Não lidas — total pro badge + o que é novo desde o último poll
      // (pra decidir o toast).
      const { data: naoLidas } = await supabase
        .from("mensagens_diretas")
        .select("id, remetente_id, conteudo, criado_em")
        .eq("destinatario_id", usuarioId!)
        .eq("lida", false);
      if (cancelado) return;

      setTotalNaoLidas(naoLidas?.length ?? 0);

      const novas = (naoLidas ?? []).filter((m) => m.criado_em > ultimoPoll);
      ultimoPoll = agora.toISOString();

      for (const mensagem of novas) {
        if (pathnameRef.current === `/mensagens/${mensagem.remetente_id}`) continue;

        let nome = nomesCache.current.get(mensagem.remetente_id);
        if (!nome) {
          const { data: pessoa } = await supabase
            .from("pessoas")
            .select("nome")
            .eq("usuario_id", mensagem.remetente_id)
            .maybeSingle();
          nome = pessoa?.nome ?? "Alguém";
          nomesCache.current.set(mensagem.remetente_id, nome);
        }
        if (cancelado) return;

        const toast: Toast = {
          id: mensagem.id,
          usuarioId: mensagem.remetente_id,
          nome,
          preview: mensagem.conteudo,
        };
        setToasts((atual) => [...atual, toast].slice(-4));
        setTimeout(() => {
          setToasts((atual) => atual.filter((t) => t.id !== toast.id));
        }, 6000);
      }
    }

    poll();
    const intervalo = setInterval(poll, INTERVALO_POLL_MS);

    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, [supabase, usuarioId]);

  const marcarLidas = useCallback((quantidade: number) => {
    setTotalNaoLidas((atual) => Math.max(0, atual - quantidade));
  }, []);

  function abrirConversa(usuarioIdDestino: string, toastId: string) {
    setToasts((atual) => atual.filter((t) => t.id !== toastId));
    router.push(`/mensagens/${usuarioIdDestino}`);
  }

  return (
    <ChatContext.Provider value={{ usuariosOnline, totalNaoLidas, marcarLidas }}>
      {children}

      {toasts.length > 0 && (
        <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-2">
          {toasts.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => abrirConversa(t.usuarioId, t.id)}
              className="w-72 rounded-lg border border-slate-200 bg-white p-3 text-left shadow-lg hover:bg-slate-50"
            >
              <p className="text-sm font-medium text-slate-900">Nova mensagem de {t.nome}</p>
              <p className="mt-0.5 truncate text-xs text-slate-500">{t.preview}</p>
            </button>
          ))}
        </div>
      )}
    </ChatContext.Provider>
  );
}
