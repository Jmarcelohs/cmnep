"use client";

import { useEffect, useRef } from "react";

const BOTOES: { comando: string; label: string; rotulo: string }[] = [
  { comando: "bold", label: "N", rotulo: "Negrito" },
  { comando: "italic", label: "I", rotulo: "Itálico" },
  { comando: "underline", label: "S", rotulo: "Sublinhado" },
  { comando: "insertUnorderedList", label: "•", rotulo: "Lista com marcadores" },
];

function celulasDaLinha(linha: HTMLTableRowElement): HTMLTableCellElement[] {
  return Array.from(linha.cells);
}

// Tabela HTML simples (sem colspan/rowspan) — primeira linha em negrito
// como cabeçalho, célula com um <br> pra ter altura mínima clicável assim
// que inserida (contentEditable não posiciona cursor bem numa célula
// totalmente vazia em todo navegador).
function montarTabelaHtml(colunas: number, linhas: number): string {
  const celula = (cabecalho: boolean) =>
    cabecalho ? "<th><br></th>" : "<td><br></td>";
  const linhaHtml = (cabecalho: boolean) =>
    `<tr>${Array.from({ length: colunas }, () => celula(cabecalho)).join("")}</tr>`;
  const corpo = Array.from({ length: Math.max(linhas - 1, 0) }, () => linhaHtml(false)).join("");
  return `<table><tbody>${linhaHtml(true)}${corpo}</tbody></table>`;
}

// Editor de texto rico minimalista (contentEditable + execCommand) — 4
// comandos básicos de texto + tabela simples. Evita puxar uma lib de editor
// inteira (Tiptap/ProseMirror etc.) só pra isso. O HTML gerado é sempre
// sanitizado de novo no servidor (ver src/lib/sanitizar-html.ts) antes de
// salvar ou renderizar no PDF — não confia no que o navegador produziu aqui.
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

  function focarEditor() {
    if (document.activeElement !== ref.current) {
      ref.current?.focus();
    }
  }

  function aplicarComando(comando: string) {
    // Só chama focus() se o editor ainda não tiver foco — o
    // onMouseDown+preventDefault do botão já preserva a seleção de texto,
    // e um focus() redundante aqui reseta o cursor pro início do
    // contentEditable em vez de manter a posição onde o usuário estava.
    focarEditor();
    document.execCommand(comando);
    onChange(ref.current?.innerHTML ?? "");
  }

  // Não existe execCommand nativo pra criar tabela — monta o HTML na mão e
  // insere na posição do cursor via "insertHTML" (suportado nos navegadores
  // baseados em Chromium, o alvo real desse editor).
  function inserirTabela() {
    const colunasStr = window.prompt("Quantas colunas?", "3");
    if (colunasStr === null) return;
    const linhasStr = window.prompt("Quantas linhas (incluindo o cabeçalho)?", "2");
    if (linhasStr === null) return;

    const colunas = Math.min(Math.max(Number(colunasStr) || 0, 1), 10);
    const linhas = Math.min(Math.max(Number(linhasStr) || 0, 1), 30);

    focarEditor();
    document.execCommand("insertHTML", false, montarTabelaHtml(colunas, linhas));
    onChange(ref.current?.innerHTML ?? "");
  }

  // Localiza a tabela mais próxima do cursor — "+ linha"/"+ coluna" agem
  // sobre ela. Sem cursor dentro de nenhuma tabela (ou com mais de uma no
  // texto e nenhuma selecionada), avisa em vez de adivinhar qual alterar.
  function tabelaSelecionada(): HTMLTableElement | null {
    const selecao = document.getSelection();
    const no = selecao?.anchorNode;
    if (!no || !ref.current?.contains(no)) return null;
    const elemento = no.nodeType === Node.ELEMENT_NODE ? (no as Element) : no.parentElement;
    return elemento?.closest("table") ?? null;
  }

  function adicionarLinha() {
    const tabela = tabelaSelecionada();
    if (!tabela) {
      window.alert("Clique dentro de uma tabela antes de adicionar uma linha.");
      return;
    }
    const ultimaLinha = tabela.rows[tabela.rows.length - 1];
    const totalColunas = ultimaLinha ? celulasDaLinha(ultimaLinha).length : 1;
    const novaLinha = tabela.insertRow();
    for (let i = 0; i < totalColunas; i++) {
      novaLinha.insertCell().innerHTML = "<br>";
    }
    onChange(ref.current?.innerHTML ?? "");
  }

  function adicionarColuna() {
    const tabela = tabelaSelecionada();
    if (!tabela) {
      window.alert("Clique dentro de uma tabela antes de adicionar uma coluna.");
      return;
    }
    Array.from(tabela.rows).forEach((linha) => {
      const ehCabecalho = linha.parentElement?.tagName === "THEAD" || linha.rowIndex === 0;
      const celula = document.createElement(ehCabecalho ? "th" : "td");
      celula.innerHTML = "<br>";
      linha.appendChild(celula);
    });
    onChange(ref.current?.innerHTML ?? "");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1 rounded-t-md border border-b-0 border-slate-300 bg-slate-50 p-1">
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
        <span className="mx-1 w-px bg-slate-300" />
        <button
          type="button"
          aria-label="Inserir tabela"
          title="Inserir tabela"
          onMouseDown={(e) => {
            e.preventDefault();
            inserirTabela();
          }}
          className="flex h-7 items-center justify-center rounded px-2 text-xs text-slate-700 hover:bg-slate-200"
        >
          Tabela
        </button>
        <button
          type="button"
          aria-label="Adicionar linha à tabela"
          title="Adicionar linha à tabela (clique numa célula primeiro)"
          onMouseDown={(e) => {
            e.preventDefault();
            adicionarLinha();
          }}
          className="flex h-7 items-center justify-center rounded px-2 text-xs text-slate-700 hover:bg-slate-200"
        >
          + Linha
        </button>
        <button
          type="button"
          aria-label="Adicionar coluna à tabela"
          title="Adicionar coluna à tabela (clique numa célula primeiro)"
          onMouseDown={(e) => {
            e.preventDefault();
            adicionarColuna();
          }}
          className="flex h-7 items-center justify-center rounded px-2 text-xs text-slate-700 hover:bg-slate-200"
        >
          + Coluna
        </button>
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
          className="rounded-b-md border border-slate-300 px-3 py-2 text-sm focus:outline-2 focus:outline-brand-navy focus:-outline-offset-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:min-h-[1.25em] [&_ul]:list-disc [&_ul]:pl-5 [&_table]:my-2 [&_table]:border-collapse [&_td]:border [&_td]:border-slate-400 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-slate-400 [&_th]:bg-slate-100 [&_th]:px-2 [&_th]:py-1 [&_th]:font-semibold"
        />
      </div>
      <input type="hidden" name={name} value={value} readOnly />
    </div>
  );
}
