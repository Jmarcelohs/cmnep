-- ========================================================================
-- Migration 0045: destinatario_cargo do Ofício do Diretor Executivo deixa
-- de ser obrigatório — assim como o tratamento (ver migration 0044), nem
-- todo destinatário tem um cargo aplicável (ex.: um setor do Executivo
-- endereçado só pelo nome, sem cargo separado).
-- ========================================================================

alter table oficios_diretor_executivo
  alter column destinatario_cargo drop not null;
