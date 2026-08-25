-- ========================================================================
-- Migration 0053: campos estruturados do Termo de Referência.
--
-- Até aqui, o TR era gerado uma vez como um bloco de HTML editável (igual
-- Capa/DFD/ETP) — o usuário editava o documento inteiro como texto livre.
-- A partir de agora, as duas partes do TR que realmente variam por
-- processo (a narrativa da solução escolhida — seção 2.3-2.5 — e a
-- natureza da execução — seção 14) viram campos estruturados no próprio
-- processo, preenchidos por um formulário dedicado (não mais editando o
-- documento inteiro). O corpo_html do documento "tr" continua existindo,
-- mas passa a ser sempre recalculado a partir desses campos (não editado
-- diretamente) — e como a Solicitação de Compra usa o mesmo registro,
-- continua espelhado automaticamente.
-- ========================================================================

alter table processos_licitatorios
  add column tr_solucao_escolhida text not null default '',
  add column tr_natureza_execucao text not null default 'nao_continuada'
    check (tr_natureza_execucao in ('continuada', 'nao_continuada')),
  add column tr_justificativa_natureza text not null default 'O objeto da presente contratação é classificado como de natureza não continuada, uma vez que sua execução se limita a um período determinado, com início e término definidos, não havendo necessidade de prolongamento ou renovação para a manutenção das atividades essenciais da instituição.';

notify pgrst, 'reload schema';
