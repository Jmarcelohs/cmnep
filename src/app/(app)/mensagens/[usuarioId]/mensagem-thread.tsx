"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useChatPresenca } from "@/app/(app)/chat-provider";

type Mensagem = {
  id: string;
  remetente_id: string;
  destinatario_id: string;
  conteudo: string;
  lida: boolean;
  criado_em: string;
};

// Conversa aberta é polling curto (aqui, não no ChatProvider global) —
// WebSocket/Realtime se mostrou bloqueado em várias redes brasileiras
// (ver migration 0030), então tanto a lista de contatos quanto a
// conversa aberta reconferem por HTTPS comum em vez de manter conexão
// aberta.
const INTERVALO_POLL_MS = 4_000;

function formatarHora(criadoEm: string) {
  return new Date(criadoEm).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MensagemThread({
  mensagensIniciais,
  meuUsuarioId,
  outroUsuarioId,
  outroNome,
}: {
  mensagensIniciais: Mensagem[];
  meuUsuarioId: string;
  outroUsuarioId: string;
  outroNome: string;
}) {
  const [mensagens, setMensagens] = useState(mensagensIniciais);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const fimDaListaRef = useRef<HTMLDivElement>(null);
  const { marcarLidas } = useChatPresenca();
  const ultimaCriadoEmRef = useRef(
    mensagensIniciais.length > 0
      ? mensagensIniciais[mensagensIniciais.length - 1].criado_em
      : new Date(0).toISOString(),
  );

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ block: "end" });
  }, [mensagens.length]);

  useEffect(() => {
    const supabase = createClient();
    let cancelado = false;

    // Marca como lida as mensagens que essa pessoa me mandou — feito aqui
    // (no mount do client component), não no server component da página,
    // pra não ser disparado por prefetch de link. Abate do contador global
    // (ChatProvider) a quantidade que já estava não lida ao abrir a tela.
    const naoLidasAoAbrir = mensagensIniciais.filter(
      (m) => m.remetente_id === outroUsuarioId && m.destinatario_id === meuUsuarioId && !m.lida,
    ).length;

    if (naoLidasAoAbrir > 0) {
      supabase
        .from("mensagens_diretas")
        .update({ lida: true })
        .eq("destinatario_id", meuUsuarioId)
        .eq("remetente_id", outroUsuarioId)
        .eq("lida", false)
        .then(() => marcarLidas(naoLidasAoAbrir));
    }

    async function poll() {
      const { data: novas } = await supabase
        .from("mensagens_diretas")
        .select("id, remetente_id, destinatario_id, conteudo, lida, criado_em")
        .eq("remetente_id", outroUsuarioId)
        .eq("destinatario_id", meuUsuarioId)
        .gt("criado_em", ultimaCriadoEmRef.current)
        .order("criado_em", { ascending: true });
      if (cancelado || !novas || novas.length === 0) return;

      ultimaCriadoEmRef.current = novas[novas.length - 1].criado_em;
      setMensagens((atual) => [...atual, ...novas]);

      const idsNaoLidas = novas.filter((m) => !m.lida).map((m) => m.id);
      if (idsNaoLidas.length > 0) {
        await supabase.from("mensagens_diretas").update({ lida: true }).in("id", idsNaoLidas);
        if (!cancelado) marcarLidas(idsNaoLidas.length);
      }
    }

    const intervalo = setInterval(poll, INTERVALO_POLL_MS);

    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
    // mensagensIniciais é só o retrato do momento em que a tela abriu —
    // de propósito não entra aqui (a comparação de "não lida" já foi feita).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meuUsuarioId, outroUsuarioId, marcarLidas]);

  async function handleEnviar(e: React.FormEvent) {
    e.preventDefault();
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;

    setEnviando(true);
    setErro(null);
    const supabase = createClient();

    const { data, error } = await supabase
      .from("mensagens_diretas")
      .insert({ remetente_id: meuUsuarioId, destinatario_id: outroUsuarioId, conteudo })
      .select()
      .single();

    if (error) {
      setErro("Não foi possível enviar a mensagem.");
    } else if (data) {
      ultimaCriadoEmRef.current = data.criado_em;
      setMensagens((atual) => [...atual, data]);
      setTexto("");
    }
    setEnviando(false);
  }

  function handleTeclado(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviar(e);
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-2 overflow-y-auto py-3">
        {mensagens.map((m) => {
          const minha = m.remetente_id === meuUsuarioId;
          return (
            <div key={m.id} className={`flex ${minha ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                  minha ? "bg-brand-navy text-white" : "bg-slate-100 text-slate-800"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.conteudo}</p>
                <p className={`mt-1 text-[10px] ${minha ? "text-white/60" : "text-slate-400"}`}>
                  {formatarHora(m.criado_em)}
                </p>
              </div>
            </div>
          );
        })}
        {mensagens.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">
            Nenhuma mensagem ainda — envie a primeira pra {outroNome}.
          </p>
        )}
        <div ref={fimDaListaRef} />
      </div>

      <form onSubmit={handleEnviar} className="flex items-end gap-2 border-t border-slate-200 pt-3">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleTeclado}
          rows={2}
          maxLength={2000}
          placeholder="Escreva uma mensagem…"
          className="flex-1 resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-none"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className="rounded-md bg-brand-navy px-4 py-2 text-sm font-medium text-white hover:bg-brand-navy-light disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
      {erro && <p className="mt-1 text-xs text-red-600">{erro}</p>}
    </div>
  );
}
