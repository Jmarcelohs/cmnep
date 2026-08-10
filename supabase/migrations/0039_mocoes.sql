-- ========================================================================
-- Migration 0039: Moções — honrarias/homenagens (aplauso e congratulações,
-- pesar e condolências, repúdio, apoio) apresentadas por um vereador e
-- votadas em plenário.
--
-- Sem numeração — diferente de Decretos e Ofícios, moção não tem um
-- registro sequencial gerido por esta ferramenta (confirmado com o
-- usuário); a data da sessão é o identificador natural.
-- ========================================================================

create table mocoes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('aplauso_congratulacoes', 'pesar_condolencias', 'repudio', 'apoio')),
  data_mocao date not null default current_date,

  destinatario text not null,

  autor_nome text not null,
  autor_partido text,

  justificativa text not null default '',

  criado_por uuid references usuarios(id),
  criado_em timestamptz default now()
);

create index idx_mocoes_data on mocoes(data_mocao);

alter table mocoes enable row level security;

-- Mesmo padrão de Decretos: qualquer usuário autenticado lê; criação
-- liberada pra qualquer servidor/estagiário; edição e exclusão restritas a
-- ordenador da despesa/admin.
create policy "mocoes_select" on mocoes for select
  using (auth.role() = 'authenticated');
create policy "mocoes_insert" on mocoes for insert
  with check (auth_papel() in ('ordenador_despesa', 'admin', 'servidor', 'estagiario'));
create policy "mocoes_update" on mocoes for update
  using (auth_papel() in ('ordenador_despesa', 'admin'));
create policy "mocoes_delete" on mocoes for delete
  using (auth_papel() in ('ordenador_despesa', 'admin'));

notify pgrst, 'reload schema';
