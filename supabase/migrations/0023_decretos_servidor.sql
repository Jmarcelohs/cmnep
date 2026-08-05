-- ========================================================================
-- Migration 0023: libera a criação de decretos de título de cidadão
-- honorário para qualquer servidor — edição e exclusão continuam
-- restritas a admin/ordenador da despesa (política de update/delete não
-- muda).
-- ========================================================================

drop policy if exists "decretos_titulo_honorario_insert" on decretos_titulo_honorario;
create policy "decretos_titulo_honorario_insert" on decretos_titulo_honorario for insert
  with check (auth_papel() in ('ordenador_despesa', 'admin', 'servidor'));

notify pgrst, 'reload schema';
