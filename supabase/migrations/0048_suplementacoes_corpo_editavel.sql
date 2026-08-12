-- ========================================================================
-- Migration 0048: campos de texto rico editável pro corpo do Ato/Decreto
-- de suplementação — título, ementa, preâmbulo e Art.1º/2º/3º passam a
-- poder ser formatados/reescritos antes de gerar o PDF (negrito, itálico,
-- alinhamento, listas), em vez de ficarem 100% fixos. Guardados
-- separadamente por documento (Ato/Decreto têm redação diferente: "RESOLVE"
-- vs "DECRETA" etc.).
--
-- null = ainda não customizado (registros antigos, ou suplementação nova
-- que o formulário ainda não salvou) — nesse caso o texto é remontado a
-- partir das fichas/valores no momento de gerar o PDF, igual sempre foi.
-- ========================================================================

alter table suplementacoes_orcamentarias
  add column corpo_ato_html text,
  add column corpo_decreto_html text;

notify pgrst, 'reload schema';
