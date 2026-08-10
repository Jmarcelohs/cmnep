-- ========================================================================
-- Migration 0040: Moções — tipos previstos no art. 117 do Regimento Interno
-- da Câmara Municipal de Nepomuceno (louvor, congratulações, pesar ou
-- repúdio). Autor e vereadores associados referenciam o cadastro de
-- Vereadores (0039) em vez de texto livre, pra poder colar a imagem da
-- assinatura de cada um automaticamente no PDF.
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
  -- Só usado no tipo 'pesar' hoje (endereçamento "À Família do Senhor/da
  -- Senhora X" e "pelo falecimento do Senhor/da Senhora X") — null nos
  -- demais tipos, que não tratam o destinatário dessa forma.
  destinatario_tratamento text check (destinatario_tratamento in ('Sr.', 'Sra.')),

  autor_vereador_id uuid not null references vereadores(id),
  -- Vereadores associados ao autor principal (podem ser um ou vários,
  -- quantidade não fixa) — array de ids de vereadores(id), cada um assina
  -- o documento. Mesmo padrão de lista jsonb já usado em
  -- avaliacoes.avaliadores (0016) pra estrutura repetível sem tabela filha.
  associados_vereadores_ids jsonb not null default '[]'::jsonb,

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
