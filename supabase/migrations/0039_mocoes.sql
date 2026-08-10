-- ========================================================================
-- Migration 0039: Moções — tipos previstos no art. 117 do Regimento Interno
-- da Câmara Municipal de Nepomuceno (louvor, congratulações, pesar ou
-- repúdio), apresentadas por um vereador (podendo ter um ou mais
-- vereadores associados) e votadas em plenário.
--
-- Sem numeração — diferente de Decretos e Ofícios, moção não tem um
-- registro sequencial gerido por esta ferramenta (confirmado com o
-- usuário); a data da sessão é o identificador natural.
-- ========================================================================

create table mocoes (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('louvor', 'congratulacoes', 'pesar', 'repudio')),
  data_mocao date not null default current_date,

  destinatario text not null,

  autor_nome text not null,
  autor_partido text,
  -- Vereadores associados ao autor principal (podem ser um ou vários,
  -- quantidade não fixa) — cada um assina o documento junto do autor e do
  -- Presidente da Câmara. Mesmo padrão de lista jsonb já usado em
  -- avaliacoes.avaliadores (0016) pra estrutura repetível sem tabela filha.
  autores_associados jsonb not null default '[]'::jsonb,

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
