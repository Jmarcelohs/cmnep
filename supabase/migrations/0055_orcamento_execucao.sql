-- ========================================================================
-- Migration 0055: Painel de Orçamento — leitura da execução orçamentária
-- por ficha (dotação inicial, suplementado, empenhado, saldo), atualizada
-- manualmente a partir da "Ficha Orçamentária" do Betha Sistemas (não há
-- integração automática — ver decisão no plano). dotacoes_orcamentarias
-- já existia (migration 0046) só com saldo_referencia; aqui ela ganha as
-- 3 colunas que faltavam pra virar o retrato completo da execução, e uma
-- tabelinha nova só pra registrar pedidos de atualização (sem "status" —
-- pendência é sempre derivada comparando o pedido mais recente com o
-- saldo_referencia_em mais recente das fichas).
-- ========================================================================

alter table dotacoes_orcamentarias
  add column dotacao_inicial_referencia numeric(14, 2),
  add column suplementado_referencia numeric(14, 2),
  add column empenhado_referencia numeric(14, 2);

-- O Painel de Orçamento (só leitura) precisa ficar visível pra
-- ordenador_despesa também, não só admin — a política de select original
-- da 0046 era admin-only; insert/update/delete continuam restritos a
-- admin (edição de ficha continua fora do escopo dessa tela).
drop policy "dotacoes_select" on dotacoes_orcamentarias;
create policy "dotacoes_select" on dotacoes_orcamentarias for select
  using (auth_papel() in ('admin', 'ordenador_despesa'));

create table orcamento_solicitacoes_atualizacao (
  id uuid primary key default gen_random_uuid(),
  solicitado_por uuid not null references usuarios(id),
  solicitado_em timestamptz not null default now()
);

alter table orcamento_solicitacoes_atualizacao enable row level security;

create policy "orcamento_solicitacoes_select" on orcamento_solicitacoes_atualizacao for select
  using (auth_papel() in ('admin', 'ordenador_despesa'));
create policy "orcamento_solicitacoes_insert" on orcamento_solicitacoes_atualizacao for insert
  with check (auth_papel() in ('admin', 'ordenador_despesa'));
