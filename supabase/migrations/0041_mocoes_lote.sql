-- ========================================================================
-- Migration 0041: agrupa moções criadas em lote (mesmo autor/associados,
-- destinatários diferentes) sob um lote_id comum — permite listar e
-- baixar todos os PDFs do lote juntos (ver /mocoes/lote/[loteId] e
-- /api/mocoes/lote/[loteId]/zip). Null pra moções criadas individualmente.
-- ========================================================================

alter table mocoes add column lote_id uuid;

create index idx_mocoes_lote_id on mocoes(lote_id) where lote_id is not null;

notify pgrst, 'reload schema';
