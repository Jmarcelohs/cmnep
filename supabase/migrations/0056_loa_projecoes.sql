-- ========================================================================
-- Migration 0056: Proposta LOA 2027 — nova aba dentro de Provisionamento
-- Orçamentário (já era a ferramenta de planejamento interno da LOA, ver
-- dotacao-tab.tsx). Cada linha é independente e totalmente editável (as
-- mesmas 7 colunas de classificação de dotacoes_orcamentarias, não uma
-- FK/cópia parcial) — é só uma mesa de trabalho de planejamento, nunca
-- vira dado oficial automaticamente quando o exercício 2027 começar.
-- ========================================================================

create table loa_projecoes (
  id uuid primary key default gen_random_uuid(),
  ano integer not null default 2027,

  -- Rastreabilidade opcional ("essa linha veio da ficha X de 2026") — nula
  -- pras dotações incluídas manualmente. Não é usada pra nada além de
  -- exibição; a classificação abaixo é sempre a fonte de verdade da linha.
  dotacao_origem_id uuid references dotacoes_orcamentarias(id) on delete set null,

  orgao_codigo text not null,
  orgao_nome text not null,
  unidade_codigo text not null,
  unidade_nome text not null,
  subfuncao_codigo text not null,
  subfuncao_nome text not null,
  programa_codigo text not null,
  programa_nome text not null,
  projeto_atividade_codigo text not null,
  projeto_atividade_nome text not null,
  elemento_codigo text not null,
  elemento_nome text not null,
  fonte_codigo text not null,
  fonte_nome text not null,

  valor_projetado numeric(14, 2) not null default 0,
  criado_em timestamptz default now()
);

alter table loa_projecoes enable row level security;

create policy "loa_projecoes_select" on loa_projecoes for select
  using (auth_papel() = 'admin');
create policy "loa_projecoes_insert" on loa_projecoes for insert
  with check (auth_papel() = 'admin');
create policy "loa_projecoes_update" on loa_projecoes for update
  using (auth_papel() = 'admin');
create policy "loa_projecoes_delete" on loa_projecoes for delete
  using (auth_papel() = 'admin');
