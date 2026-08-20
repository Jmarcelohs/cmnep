-- ========================================================================
-- Migration 0049: Provisionamento Orçamentário — tabela de contratos
-- administrativos usada pra projetar, mês a mês, o valor esperado em cada
-- ficha orçamentária (ver src/lib/provisionamento/calculo.ts). Antes esse
-- módulo guardava tudo no localStorage do navegador; passa a usar o
-- Supabase, igual ao resto do sistema — admin-only, mesma sensibilidade
-- de Suplementações Orçamentárias (movimento orçamentário/contábil).
-- ========================================================================

create table provisionamento_contratos (
  id uuid primary key default gen_random_uuid(),

  nome text not null,
  fornecedor text not null default '',

  valor_vigente numeric(14, 2) not null,
  tipo_valor text not null check (tipo_valor in ('mensal', 'anual')),

  data_inicio_vigencia date not null,
  data_fim_vigencia date not null,
  data_proximo_reajuste date not null,
  indice_correcao text not null,
  -- Fração (0.05 = 5%), não o número inteiro — mesma convenção do tipo
  -- Contrato em src/lib/provisionamento/tipos.ts.
  percentual_estimado numeric(7, 4) not null,

  situacao text not null check (situacao in ('continua', 'vence', 'nova_licitacao')),
  valor_novo_contrato_estimado numeric(14, 2),
  data_inicio_novo_contrato date,

  ficha_orcamentaria text not null default '',
  dotacao text not null default '',
  elemento_despesa text not null default '',
  observacoes text not null default '',

  criado_por uuid references usuarios(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index idx_provisionamento_contratos_ficha on provisionamento_contratos(ficha_orcamentaria);

alter table provisionamento_contratos enable row level security;

create policy "provisionamento_contratos_select" on provisionamento_contratos for select
  using (auth_papel() = 'admin');
create policy "provisionamento_contratos_insert" on provisionamento_contratos for insert
  with check (auth_papel() = 'admin');
create policy "provisionamento_contratos_update" on provisionamento_contratos for update
  using (auth_papel() = 'admin');
create policy "provisionamento_contratos_delete" on provisionamento_contratos for delete
  using (auth_papel() = 'admin');

notify pgrst, 'reload schema';
