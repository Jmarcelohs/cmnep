"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MensagemDireta = {
  id: string;
  remetente_id: string;
  destinatario_id: string;
  conteudo: string;
  lida: boolean;
  criado_em: string;
};

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

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (!usuarioId) return;

    const canal = supabase
      .channel("presenca-e-mensagens", { config: { presence: { key: usuarioId } } })
      .on("presence", { event: "sync" }, () => {
        setUsuariosOnline(new Set(Object.keys(canal.presenceState())));
      })
      .on<MensagemDireta>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens_diretas",
          filter: `destinatario_id=eq.${usuarioId}`,
        },
        async (payload) => {
          const mensagem = payload.new;
          setTotalNaoLidas((atual) => atual + 1);

          // Já estou com essa conversa aberta — a própria tela já mostra a
          // mensagem ao vivo, não precisa notificar de novo.
          if (pathnameRef.current === `/mensagens/${mensagem.remetente_id}`) return;

          const { data: pessoa } = await supabase
            .from("pessoas")
            .select("nome")
            .eq("usuario_id", mensagem.remetente_id)
            .maybeSingle();

          const toast: Toast = {
            id: mensagem.id,
            usuarioId: mensagem.remetente_id,
            nome: pessoa?.nome ?? "Alguém",
            preview: mensagem.conteudo,
          };
          setToasts((atual) => [...atual, toast].slice(-4));
          setTimeout(() => {
            setToasts((atual) => atual.filter((t) => t.id !== toast.id));
          }, 6000);
        },
      )
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await canal.track({});
      });

    return () => {
      supabase.removeChannel(canal);
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
