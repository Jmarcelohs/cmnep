-- ========================================================================
-- Migration 0027: novo papel "estagiario" — mesmo acesso de servidor em
-- Secretaria (Decretos, Ofícios) e Recursos Humanos (Requerimentos
-- Internos), mas SEM acesso a Diárias, Reembolsos e Veículos.
--
-- Esse bloqueio é aplicado na camada de aplicação (ver src/lib/nav.ts e
-- os layout guards em diarias/requerimentos/veiculos) — não muda nenhuma
-- policy de RLS de diárias/reembolso/veículos, porque o auto-atendimento
-- nessas tabelas (pessoa_id = auth_pessoa_id()) já é aberto pra qualquer
-- papel, não é condicionado a "servidor" especificamente.
--
-- Também adiciona "Estagiário" como categoria válida em Pessoas, pra
-- cadastrar os estagiários corretamente (hoje só havia Efetivo,
-- Comissionado, Vereador).
-- ========================================================================

alter table usuarios drop constraint if exists usuarios_papel_check;
alter table usuarios add constraint usuarios_papel_check check (papel in (
  'admin',
  'servidor',
  'ordenador_despesa',
  'tesoureiro',
  'controle_interno',
  'gestor_diarias',
  'estagiario'
));

alter table pessoas drop constraint if exists pessoas_categoria_check;
alter table pessoas add constraint pessoas_categoria_check check (categoria in (
  'Efetivo',
  'Comissionado',
  'Vereador',
  'Estagiário'
));

-- Libera estagiário pra criar decretos e ofícios, igual servidor
-- (edição/exclusão continuam restritas a admin/ordenador da despesa).
drop policy if exists "decretos_titulo_honorario_insert" on decretos_titulo_honorario;
create policy "decretos_titulo_honorario_insert" on decretos_titulo_honorario for insert
  with check (auth_papel() in ('ordenador_despesa', 'admin', 'servidor', 'estagiario'));

drop policy if exists "oficios_insert" on oficios;
create policy "oficios_insert" on oficios for insert
  with check (auth_papel() in ('ordenador_despesa','admin','servidor','estagiario'));

notify pgrst, 'reload schema';
