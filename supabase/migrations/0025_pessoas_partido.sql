-- ========================================================================
-- Migration 0025: partido político do vereador — só faz sentido pra
-- categoria='Vereador', mas fica solto (sem check de categoria) pelo mesmo
-- motivo de outros campos condicionais desse cadastro único (ex.: cargo):
-- a tela já esconde/mostra o campo certo conforme a categoria.
-- ========================================================================

alter table pessoas add column partido text;

notify pgrst, 'reload schema';
