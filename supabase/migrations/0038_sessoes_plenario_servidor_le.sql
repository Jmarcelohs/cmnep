-- ========================================================================
-- Libera a leitura de sessoes_plenario_decisoes pra servidor também —
-- só pra terem conhecimento dos pedidos (mesma tela mostra CPF/CNPJ e
-- telefone de terceiros, decidido junto com o usuário: servidor vê
-- exatamente como admin/ordenador já veem). Aprovar/recusar continua
-- restrito a admin/ordenador_despesa (sem mudança nas outras policies
-- nem em src/app/(app)/plenario/actions.ts).
-- ========================================================================

drop policy "sessoes_plenario_select" on sessoes_plenario_decisoes;

create policy "sessoes_plenario_select" on sessoes_plenario_decisoes for select
  using (auth_papel() in ('ordenador_despesa', 'admin', 'servidor'));

notify pgrst, 'reload schema';
