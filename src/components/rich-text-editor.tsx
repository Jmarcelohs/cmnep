"use client";

import { useEffect, useRef } from "react";

const BOTOES: { comando: string; label: string; rotulo: string }[] = [
  { comando: "bold", label: "N", rotulo: "Negrito" },
  { comando: "italic", label: "I", rotulo: "Itálico" },
  { comando: "underline", label: "S", rotulo: "Sublinhado" },
  { comando: "insertUnorderedList", label: "•", rotulo: "Lista com marcadores" },
];

// Só as 2 fontes que a Base de Formatação da Câmara permite (Times New
// Roman ou Arial) — o valor exato precisa bater com o regex de
// allowedStyles em sanitizar-html.ts, senão a escolha se perde ao salvar.
const FONTES: { label: string; valor: string }[] = [
  { label: "Arial", valor: "Arial, Helvetica, sans-serif" },
  { label: "Times New Roman", valor: "'Times New Roman', Times, serif" },
];

// Hierarquia título/subtítulo/corpo/nota da Base de Formatação — mesmos 6
// valores aceitos em sanitizar-html.ts.
const TAMANHOS_FONTE = [10, 11, 12, 14, 16, 18];

// Largura de uma página A4 retrato — único formato usado pelos documentos
// que têm campo de texto rico hoje (Ofícios, Ofício do Diretor Executivo,
// Suplementações). Se algum dia esse editor for usado numa página paisagem
// (ex.: Moção de Congratulação), a régua vai ficar incorreta — não vale a
// complexidade de receber orientação como prop enquanto não houver um uso
// real assim.
const LARGURA_PAGINA_MM = 210;

// Régua horizontal só de referência visual (não arrasta marcador de
// recuo/tabulação — isso já existe nos botões "Recuo +/-" da barra de
// ferramentas) — mostra a largura real da página impressa, com a margem
// esquerda/direita sombreada, pra quem está digitando ter noção de onde o
// texto vai cair no documento final. Cada consumidor deste editor passa a
// margem real do template PDF que ele gera (ver margemEsquerdaMm/
// margemDireitaMm em RichTextEditor).
function Regua({
  margemEsquerdaMm,
  margemDireitaMm,
}: {
  margemEsquerdaMm: number;
  margemDireitaMm: number;
}) {
  const centimetros = Array.from({ length: LARGURA_PAGINA_MM / 10 + 1 }, (_, i) => i);

  return (
    <div
      aria-hidden="true"
      className="relative h-5 select-none overflow-hidden border-x border-t border-slate-300 bg-white"
    >
      <div
        className="absolute inset-y-0 left-0 bg-slate-100"
        style={{ width: `${(margemEsquerdaMm / LARGURA_PAGINA_MM) * 100}%` }}
      />
      <div
        className="absolute inset-y-0 right-0 bg-slate-100"
        style={{ width: `${(margemDireitaMm / LARGURA_PAGINA_MM) * 100}%` }}
      />
      {centimetros.map((cm) => (
        <span
          key={cm}
          className={`absolute bottom-0 w-px bg-slate-400 ${cm % 5 === 0 ? "h-2.5" : "h-1.5"}`}
          style={{ left: `${((cm * 10) / LARGURA_PAGINA_MM) * 100}%` }}
        />
      ))}
      {centimetros
        .filter((cm) => cm % 5 === 0)
        .map((cm) => (
          <span
            key={cm}
            className="absolute top-0 -translate-x-1/2 text-[9px] leading-tight text-slate-500"
            style={{ left: `${((cm * 10) / LARGURA_PAGINA_MM) * 100}%` }}
          >
            {cm}
          </span>
        ))}
    </div>
  );
}

// justifyLeft/Center/Right/Full são execCommand nativos — no Chrome eles só
// marcam text-align inline no bloco atual (sem envolver numa tag nova), por
// isso dá pra reaproveitar o mesmo aplicarComando() dos botões acima. Fica
// permitido no sanitizador (ver src/lib/sanitizar-html.ts) só esse estilo.
const ALINHAMENTOS: { comando: string; label: string; rotulo: string }[] = [
  { comando: "justifyLeft", label: "Esquerda", rotulo: "Alinhar à esquerda" },
  { comando: "justifyCenter", label: "Centro", rotulo: "Centralizar" },
  { comando: "justifyRight", label: "Direita", rotulo: "Alinhar à direita" },
  { comando: "justifyFull", label: "Justificado", rotulo: "Justificar" },
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
  // Margem esquerda/direita reais do template PDF que este texto alimenta
  // — só usado pra desenhar a régua proporcionalmente correta (ver Regua
  // acima). Padrão 30mm/20mm bate com Ofícios e Suplementações; Ofício do
  // Diretor Executivo passa 30mm/30mm explicitamente.
  margemEsquerdaMm = 30,
  margemDireitaMm = 20,
}: {
  name: string;
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  margemEsquerdaMm?: number;
  margemDireitaMm?: number;
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

  // Parágrafo(s) sob o cursor ou abrangidos pela seleção — "Recuo +"/"Recuo
  // -" agem sobre eles. Não usa o execCommand nativo "indent" porque ele
  // embrulha o bloco num <blockquote> com margin (uma tag/propriedade a
  // mais pra permitir no sanitizador, e um jeito de recuar diferente do
  // text-indent de primeira linha já usado no resto do documento) — aqui
  // ajusta o mesmo text-indent direto no <p>, sem trocar a estrutura.
  function paragrafosSelecionados(): HTMLParagraphElement[] {
    if (!ref.current) return [];
    const selecao = document.getSelection();
    if (!selecao || selecao.rangeCount === 0) return [];
    const intervalo = selecao.getRangeAt(0);
    if (!ref.current.contains(intervalo.commonAncestorContainer)) return [];

    const todosOsParagrafos = Array.from(ref.current.querySelectorAll("p"));
    const abrangidos = todosOsParagrafos.filter((p) => intervalo.intersectsNode(p));
    if (abrangidos.length > 0) return abrangidos;

    const no = selecao.anchorNode;
    const elemento = no && (no.nodeType === Node.ELEMENT_NODE ? (no as Element) : no.parentElement);
    const paragrafoAtual = elemento?.closest("p");
    return paragrafoAtual ? [paragrafoAtual] : [];
  }

  function ajustarRecuo(comIndentacao: boolean) {
    focarEditor();
    const paragrafos = paragrafosSelecionados();
    if (paragrafos.length === 0) return;
    paragrafos.forEach((p) => {
      p.style.textIndent = comIndentacao ? "1.25cm" : "0cm";
    });
    onChange(ref.current?.innerHTML ?? "");
  }

  // Um <select> nativo, diferente dos botões acima, tira o foco (e a
  // seleção de texto) do contentEditable assim que o usuário clica pra
  // abrir a lista — não dá pra só preventDefault() o mousedown como nos
  // botões, senão a lista nem abre. Por isso captura os parágrafos
  // afetados no mousedown (ainda com a seleção intacta, antes do troca de
  // foco) e só aplica o estilo depois, no onChange do select.
  const paragrafosCapturadosRef = useRef<HTMLParagraphElement[]>([]);

  function capturarParagrafos() {
    paragrafosCapturadosRef.current = paragrafosSelecionados();
  }

  function aplicarFonte(propriedade: "fontFamily" | "fontSize", valor: string) {
    const paragrafos = paragrafosCapturadosRef.current;
    if (!ref.current || paragrafos.length === 0) return;
    paragrafos.forEach((p) => {
      p.style[propriedade] = valor;
    });
    onChange(ref.current.innerHTML);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 border-slate-300 bg-slate-50 p-1">
        <select
          aria-label="Fonte"
          title="Fonte"
          defaultValue=""
          onMouseDown={capturarParagrafos}
          onChange={(e) => {
            aplicarFonte("fontFamily", e.target.value);
            e.target.value = "";
          }}
          className="h-7 rounded border border-slate-300 bg-white px-1 text-xs text-slate-700"
        >
          <option value="" disabled>
            Fonte…
          </option>
          {FONTES.map((fonte) => (
            <option key={fonte.valor} value={fonte.valor}>
              {fonte.label}
            </option>
          ))}
        </select>
        <select
          aria-label="Tamanho da fonte"
          title="Tamanho da fonte"
          defaultValue=""
          onMouseDown={capturarParagrafos}
          onChange={(e) => {
            aplicarFonte("fontSize", `${e.target.value}pt`);
            e.target.value = "";
          }}
          className="h-7 rounded border border-slate-300 bg-white px-1 text-xs text-slate-700"
        >
          <option value="" disabled>
            Tamanho…
          </option>
          {TAMANHOS_FONTE.map((tamanho) => (
            <option key={tamanho} value={tamanho}>
              {tamanho}pt
            </option>
          ))}
        </select>
        <span className="mx-1 w-px bg-slate-300" />
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
        {ALINHAMENTOS.map((botao) => (
          <button
            key={botao.comando}
            type="button"
            aria-label={botao.rotulo}
            title={botao.rotulo}
            onMouseDown={(e) => {
              e.preventDefault();
              aplicarComando(botao.comando);
            }}
            className="flex h-7 items-center justify-center rounded px-2 text-xs text-slate-700 hover:bg-slate-200"
          >
            {botao.label}
          </button>
        ))}
        <span className="mx-1 w-px bg-slate-300" />
        <button
          type="button"
          aria-label="Diminuir recuo do parágrafo"
          title="Diminuir recuo do parágrafo"
          onMouseDown={(e) => {
            e.preventDefault();
            ajustarRecuo(false);
          }}
          className="flex h-7 items-center justify-center rounded px-2 text-xs text-slate-700 hover:bg-slate-200"
        >
          Recuo −
        </button>
        <button
          type="button"
          aria-label="Aumentar recuo do parágrafo"
          title="Aumentar recuo do parágrafo"
          onMouseDown={(e) => {
            e.preventDefault();
            ajustarRecuo(true);
          }}
          className="flex h-7 items-center justify-center rounded px-2 text-xs text-slate-700 hover:bg-slate-200"
        >
          Recuo +
        </button>
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
      <Regua margemEsquerdaMm={margemEsquerdaMm} margemDireitaMm={margemDireitaMm} />
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
          // [&_p]:mb-2 — mesmo espaçamento (~2mm) que o wrapper flex-col
          // gap-2 aplica entre blocos no PDF final (ver ato-mesa-diretora-
          // conteudo.tsx/decreto-suplementacao-conteudo.tsx). Sem isso os
          // parágrafos aparecem colados aqui no editor mesmo saindo com
          // espaço no documento gerado — o que engana quem está editando.
          className="rounded-b-md border border-slate-300 px-3 py-2 text-sm focus:outline-2 focus:outline-brand-navy focus:-outline-offset-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p]:min-h-[1.25em] [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_table]:my-2 [&_table]:border-collapse [&_td]:border [&_td]:border-slate-400 [&_td]:px-2 [&_td]:py-1 [&_th]:border [&_th]:border-slate-400 [&_th]:bg-slate-100 [&_th]:px-2 [&_th]:py-1 [&_th]:font-semibold"
        />
      </div>
      <input type="hidden" name={name} value={value} readOnly />
    </div>
  );
}
