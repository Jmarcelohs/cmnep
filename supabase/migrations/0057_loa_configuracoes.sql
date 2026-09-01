create table loa_configuracoes (
  ano integer primary key,
  valor_total numeric(14, 2) not null default 0,
  atualizado_em timestamptz not null default now()
);

alter table loa_configuracoes enable row level security;

create policy "loa_configuracoes_select" on loa_configuracoes for select using (auth_papel() = 'admin');
create policy "loa_configuracoes_insert" on loa_configuracoes for insert with check (auth_papel() = 'admin');
create policy "loa_configuracoes_update" on loa_configuracoes for update using (auth_papel() = 'admin');
