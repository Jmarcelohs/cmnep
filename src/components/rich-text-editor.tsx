"use client";

import { useEffect, useRef } from "react";

const BOTOES: { comando: string; label: string; rotulo: string }[] = [
  { comando: "bold", label: "N", rotulo: "Negrito" },
  { comando: "italic", label: "I", rotulo: "Itálico" },
  { comando: "underline", label: "S", rotulo: "Sublinhado" },
  { comando: "insertUnorderedList", label: "•", rotulo: "Lista com marcadores" },
];

// Editor de texto rico minimalista (contentEditable + execCommand) — só
// pros 4 comandos básicos acima. Evita puxar uma lib de editor inteira
// (Tiptap/ProseMirror etc.) pra formatar negrito/itálico/sublinhado/lista
// numa única caixa do sistema. O HTML gerado é sempre sanitizado de novo no
// servidor (ver src/lib/sanitizar-html.ts) antes de salvar ou renderizar no
// PDF — não confia no que o navegador produziu aqui.
export function RichTextEditor({
  name,
  value,
  onChange,
  placeholder,
  minHeight = "10rem",
}: {
  name: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Sem isso, Enter num contentEditable "cru" não cria um bloco novo bem
  // definido em todo navegador — daí "insertUnorderedList" não sabe onde
  // termina a linha atual e agarra o conteúdo inteiro num <li> só. Forçando
  // <p> como separador, cada Enter vira um parágrafo de verdade.
  useEffect(() => {
    document.execCommand("defaultParagraphSeparator", false, "p");
  }, []);

  // Só sincroniza quando o valor muda por fora (ex.: carregar um registro
  // existente pra editar) — nunca a cada tecla, senão o cursor volta pro
  // início a cada letra digitada. Começa sempre com um <p> (mesmo vazio):
  // sem isso, a primeira linha digitada fica como texto solto, sem bloco
  // — e "insertUnorderedList" não consegue isolar só essa linha, agarrando
  // o editor inteiro num <li> só.
  useEffect(() => {
    const html = value || "<p><br></p>";
    if (ref.current && ref.current.innerHTML !== html) {
      ref.current.innerHTML = html;
    }
  }, [value]);

  // :empty não serve mais pro placeholder — o editor sempre tem pelo menos
  // um <p><br></p> por dentro (ver useEffect acima), nunca fica realmente
  // vazio no sentido do DOM.
  const estaVazio = value.replace(/<[^>]*>/g, "").trim().length === 0;

  function aplicarComando(comando: string) {
    // Só chama focus() se o editor ainda não tiver foco — o
    // onMouseDown+preventDefault do botão já preserva a seleção de texto,
    // e um focus() redundante aqui reseta o cursor pro início do
    // contentEditable em vez de manter a posição onde o usuário estava.
    if (document.activeElement !== ref.current) {
      ref.current?.focus();
    }
    document.execCommand(comando);
    onChange(ref.current?.innerHTML ?? "");
  }

  return (
    <div>
      <div className="flex gap-1 rounded-t-md border border-b-0 border-slate-300 bg-slate-50 p-1">
        {BOTOES.map((botao) => (
          <button
            key={botao.comando}
            type="button"
            aria-label={botao.rotulo}
            title={botao.rotulo}
            // onMouseDown (não onClick) + preventDefault: um clique comum
            // tiraria o foco do contentEditable antes do handler rodar,
            // perdendo a seleção de texto que o comando precisa.
            onMouseDown={(e) => {
              e.preventDefault();
              aplicarComando(botao.comando);
            }}
            className="flex h-7 w-7 items-center justify-center rounded text-sm text-slate-700 hover:bg-slate-200"
          >
            {botao.label}
          </button>
        ))}
      </div>
      <div className="relative">
        {estaVazio && placeholder && (
          <p className="pointer-events-none absolute top-2 left-3 text-sm text-slate-400">
            {placeholder}
          </p>
        )}
        <div
          ref={ref}
          contentEditable
          role="textbox"
          aria-multiline="true"
          aria-label={placeholder}
          onInput={() => onChange(ref.current?.innerHTML ?? "")}
          style={{ minHeight }}
          className="rounded-b-md border border-slate-300 px-3 py-2 text-sm focus:outline-2 focus:outline-brand-navy focus:-outline-offset-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:min-h-[1.25em] [&_ul]:list-disc [&_ul]:pl-5"
        />
      </div>
      <input type="hidden" name={name} value={value} readOnly />
    </div>
  );
}
