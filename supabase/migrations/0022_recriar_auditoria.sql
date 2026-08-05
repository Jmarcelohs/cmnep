-- ========================================================================
-- Migration 0022: recria a tabela/gatilhos de auditoria (migration 0020),
-- que sumiram do banco por algum motivo fora do controle da aplicação —
-- confirmado que não era cache do PostgREST (a tabela não aparecia nem no
-- Table Editor) e que a ausência do gatilho não estava bloqueando escrita
-- nas tabelas normais. Escrita idempotente (IF NOT EXISTS / OR REPLACE /
-- DROP...IF EXISTS antes de recriar) pra poder rodar com segurança mesmo
-- que parte da estrutura ainda exista.
-- ========================================================================

create table if not exists auditoria (
  id uuid primary key default gen_random_uuid(),
  tabela text not null,
  registro_id uuid,
  operacao text not null check (operacao in ('INSERT', 'UPDATE', 'DELETE')),
  dados_antigos jsonb,
  dados_novos jsonb,
  usuario_id uuid references usuarios(id),
  usuario_nome text,
  criado_em timestamptz default now()
);

create index if not exists idx_auditoria_tabela on auditoria(tabela);
create index if not exists idx_auditoria_registro on auditoria(registro_id);
create index if not exists idx_auditoria_criado_em on auditoria(criado_em desc);

alter table auditoria enable row level security;

drop policy if exists "auditoria_select_admin" on auditoria;
create policy "auditoria_select_admin" on auditoria for select
  using (auth_papel() = 'admin');

create or replace function registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id uuid;
  v_usuario_nome text;
begin
  select id, nome into v_usuario_id, v_usuario_nome
  from usuarios where auth_user_id = auth.uid();

  insert into auditoria (tabela, registro_id, operacao, dados_antigos, dados_novos, usuario_id, usuario_nome)
  values (
    TG_TABLE_NAME,
    coalesce(NEW.id, OLD.id),
    TG_OP,
    case when TG_OP != 'INSERT' then to_jsonb(OLD) else null end,
    case when TG_OP != 'DELETE' then to_jsonb(NEW) else null end,
    v_usuario_id,
    v_usuario_nome
  );

  return coalesce(NEW, OLD);
end;
$$;

drop trigger if exists trg_auditoria_diarias_solicitacoes on diarias_solicitacoes;
create trigger trg_auditoria_diarias_solicitacoes
  after insert or update or delete on diarias_solicitacoes
  for each row execute function registrar_auditoria();

drop trigger if exists trg_auditoria_diarias_prestacoes_contas on diarias_prestacoes_contas;
create trigger trg_auditoria_diarias_prestacoes_contas
  after insert or update or delete on diarias_prestacoes_contas
  for each row execute function registrar_auditoria();

drop trigger if exists trg_auditoria_diarias_prestacoes_pagamentos on diarias_prestacoes_pagamentos;
create trigger trg_auditoria_diarias_prestacoes_pagamentos
  after insert or update or delete on diarias_prestacoes_pagamentos
  for each row execute function registrar_auditoria();

drop trigger if exists trg_auditoria_requerimentos_internos on requerimentos_internos;
create trigger trg_auditoria_requerimentos_internos
  after insert or update or delete on requerimentos_internos
  for each row execute function registrar_auditoria();

drop trigger if exists trg_auditoria_requerimentos_reembolso on requerimentos_reembolso;
create trigger trg_auditoria_requerimentos_reembolso
  after insert or update or delete on requerimentos_reembolso
  for each row execute function registrar_auditoria();

drop trigger if exists trg_auditoria_veiculos_locacao_solicitacoes on veiculos_locacao_solicitacoes;
create trigger trg_auditoria_veiculos_locacao_solicitacoes
  after insert or update or delete on veiculos_locacao_solicitacoes
  for each row execute function registrar_auditoria();

drop trigger if exists trg_auditoria_decretos_titulo_honorario on decretos_titulo_honorario;
create trigger trg_auditoria_decretos_titulo_honorario
  after insert or update or delete on decretos_titulo_honorario
  for each row execute function registrar_auditoria();

drop trigger if exists trg_auditoria_pessoas on pessoas;
create trigger trg_auditoria_pessoas
  after insert or update or delete on pessoas
  for each row execute function registrar_auditoria();

drop trigger if exists trg_auditoria_usuarios on usuarios;
create trigger trg_auditoria_usuarios
  after insert or update or delete on usuarios
  for each row execute function registrar_auditoria();

drop trigger if exists trg_auditoria_avaliacoes on avaliacoes;
create trigger trg_auditoria_avaliacoes
  after insert or update or delete on avaliacoes
  for each row execute function registrar_auditoria();

notify pgrst, 'reload schema';
