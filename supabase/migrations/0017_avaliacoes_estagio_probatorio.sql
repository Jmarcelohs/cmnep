-- ========================================================================
-- Migration 0017: distingue avaliação de servidor em estágio probatório
--
-- O único template hoje (§1 da especificação original) é justamente o de
-- "Avaliação Final de Desempenho de Servidor(a) em Estágio Probatório" —
-- mas nem todo servidor avaliado está necessariamente em estágio
-- probatório no momento do lançamento. Em vez de criar um segundo
-- template (mesmos critérios/itens, só muda o título do documento),
-- adiciona um campo por avaliação: o usuário marca manualmente se o
-- servidor está em estágio probatório (não há dado de data de admissão
-- no sistema pra calcular isso automaticamente).
--
-- Default true porque os 8 servidores/avaliações de exemplo do documento
-- original eram todos desse contexto.
-- ========================================================================

alter table avaliacoes
  add column if not exists em_estagio_probatorio boolean not null default true;

notify pgrst, 'reload schema';
