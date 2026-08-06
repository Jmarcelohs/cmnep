-- ========================================================================
-- Data da baixa do pagamento — mesmo padrão de data_aprovacao_ordenador e
-- parecer_data (cada etapa de decisão já tem sua própria coluna de data),
-- só faltava essa. Usado na linha do tempo da diária.
-- ========================================================================

alter table diarias_prestacoes_contas add column data_baixa date;

notify pgrst, 'reload schema';
