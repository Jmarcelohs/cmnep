"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Mensagem = {
  id: string;
  remetente_id: string;
  destinatario_id: string;
  conteudo: string;
  lida: boolean;
  criado_em: string;
};

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

  useEffect(() => {
    fimDaListaRef.current?.scrollIntoView({ block: "end" });
  }, [mensagens.length]);

  useEffect(() => {
    const supabase = createClient();

    // Marca como lida as mensagens que essa pessoa me mandou — feito aqui
    // (no mount do client component), não no server component da página,
    // pra não ser disparado por prefetch de link.
    supabase
      .from("mensagens_diretas")
      .update({ lida: true })
      .eq("destinatario_id", meuUsuarioId)
      .eq("remetente_id", outroUsuarioId)
      .eq("lida", false)
      .then();

    const canal = supabase
      .channel(`mensagens-diretas-${meuUsuarioId}-${outroUsuarioId}`)
      .on<Mensagem>(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensagens_diretas",
          filter: `destinatario_id=eq.${meuUsuarioId}`,
        },
        (payload) => {
          if (payload.new.remetente_id !== outroUsuarioId) return;
          setMensagens((atual) => [...atual, payload.new]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canal);
    };
  }, [meuUsuarioId, outroUsuarioId]);

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
