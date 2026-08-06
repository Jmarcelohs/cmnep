-- ========================================================================
-- Chat interno — versão enxuta: mensagens diretas (1-1) entre usuários
-- logados, sem grupos. Sem tabela de "conversa" separada — a lista de
-- conversas é derivada em código a partir do par remetente/destinatário.
-- ========================================================================

create or replace function auth_usuario_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select id from usuarios where auth_user_id = auth.uid();
$$;

create table mensagens_diretas (
  id uuid primary key default gen_random_uuid(),
  remetente_id uuid references usuarios(id) not null,
  destinatario_id uuid references usuarios(id) not null,
  conteudo text not null,
  lida boolean not null default false,
  criado_em timestamptz default now(),
  check (remetente_id <> destinatario_id)
);

create index idx_mensagens_diretas_par on mensagens_diretas(remetente_id, destinatario_id, criado_em);
create index idx_mensagens_diretas_destinatario on mensagens_diretas(destinatario_id, lida);

alter table mensagens_diretas enable row level security;

create policy "mensagens_diretas_select" on mensagens_diretas for select
  using (remetente_id = auth_usuario_id() or destinatario_id = auth_usuario_id());

create policy "mensagens_diretas_insert" on mensagens_diretas for insert
  with check (remetente_id = auth_usuario_id());

-- Só o destinatário marca como lida. Igual ao resto do app (ex.: as 3 etapas
-- de aprovação de prestação de contas), a policy não trava coluna por
-- coluna — a UI só manda {lida: true}, nunca reescreve o conteúdo.
create policy "mensagens_diretas_update" on mensagens_diretas for update
  using (destinatario_id = auth_usuario_id())
  with check (destinatario_id = auth_usuario_id());

alter publication supabase_realtime add table mensagens_diretas;

notify pgrst, 'reload schema';
