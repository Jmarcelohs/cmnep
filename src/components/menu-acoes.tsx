"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Agrupa os botões de ação de uma linha de tabela (Ver, Editar, Salvar
// PDF, Excluir etc.) num único botão "Ações", em vez de um por um lado a
// lado — economiza espaço horizontal e deixa a tabela mais limpa. Os
// itens continuam sendo os mesmos componentes de sempre (Link,
// DownloadPdfButton, ExcluirSolicitacaoButton...), só que empilhados
// verticalmente dentro do menu (ver variant="menu" desses componentes).
//
// O painel é renderizado num portal (document.body) em vez de dentro da
// célula da tabela: os wrappers de tabela usam "overflow-x-auto", e
// definir overflow só no eixo X faz o navegador tratar o eixo Y como
// "auto" também (regra do CSS), cortando qualquer coisa posicionada como
// "absolute" que exceda a altura da linha. Com portal + position:fixed
// calculado a partir do botão, o menu escapa desse corte.
export function MenuAcoes({ children }: { children: React.ReactNode }) {
  const [aberto, setAberto] = useState(false);
  const [posicao, setPosicao] = useState({ top: 0, left: 0 });
  const botaoRef = useRef<HTMLButtonElement>(null);
  const painelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;

    function reposicionar() {
      const rect = botaoRef.current?.getBoundingClientRect();
      if (!rect) return;
      const larguraPainel = 192; // w-48
      setPosicao({
        top: rect.bottom + 4,
        left: Math.min(rect.right - larguraPainel, window.innerWidth - larguraPainel - 8),
      });
    }
    reposicionar();

    // O painel é um portal no fim do <body>, fora da ordem natural do
    // DOM — sem focar o primeiro item aqui, dar Tab a partir do botão
    // pularia direto pro próximo elemento da página, pulando o menu
    // inteiro (item inalcançável por teclado).
    const focaveisSeletor = "a, button:not(:disabled), [tabindex]";
    painelRef.current?.querySelector<HTMLElement>(focaveisSeletor)?.focus();

    function aoClicarFora(evento: MouseEvent) {
      const alvo = evento.target as Node;
      if (
        botaoRef.current &&
        !botaoRef.current.contains(alvo) &&
        painelRef.current &&
        !painelRef.current.contains(alvo)
      ) {
        setAberto(false);
      }
    }

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setAberto(false);
        botaoRef.current?.focus();
        return;
      }
      if (evento.key !== "Tab") return;

      // Prende o foco dentro do painel enquanto ele estiver aberto —
      // Tab no último item volta pro primeiro, Shift+Tab no primeiro
      // vai pro último, em vez de escapar pro resto da página.
      const focaveis = painelRef.current?.querySelectorAll<HTMLElement>(focaveisSeletor);
      if (!focaveis || focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("mousedown", aoClicarFora);
    document.addEventListener("keydown", aoTeclar);
    window.addEventListener("resize", reposicionar);
    window.addEventListener("scroll", reposicionar, true);
    return () => {
      document.removeEventListener("mousedown", aoClicarFora);
      document.removeEventListener("keydown", aoTeclar);
      window.removeEventListener("resize", reposicionar);
      window.removeEventListener("scroll", reposicionar, true);
    };
  }, [aberto]);

  return (
    <>
      <button
        ref={botaoRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={aberto}
        onClick={(e) => {
          e.stopPropagation();
          setAberto((v) => !v);
        }}
        className="flex items-center gap-1 rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        Ações
        <svg
          width="10"
          height="10"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform ${aberto ? "rotate-180" : ""}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {aberto &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={painelRef}
            role="menu"
            onClick={() => {
              // Fecha depois do clique atual terminar de ser processado —
              // não na hora. Um botão type="submit" só dispara o envio do
              // formulário DEPOIS da fase de bubble do evento de clique;
              // fechar o menu na hora (setAberto direto) desmonta o
              // formulário do DOM antes desse envio acontecer, e o clique
              // em Autorizar/Excluir/etc. simplesmente não fazia nada.
              setTimeout(() => setAberto(false), 0);
            }}
            style={{ top: posicao.top, left: posicao.left }}
            className="fixed z-50 w-48 overflow-hidden rounded-md border border-slate-200 bg-white py-1 text-left shadow-lg"
          >
            {children}
          </div>,
          document.body,
        )}
    </>
  );
}
