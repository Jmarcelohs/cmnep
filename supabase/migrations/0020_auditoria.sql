-- ========================================================================
-- Migration 0020: Histórico e auditoria do sistema — registra automaticamente
-- toda criação, edição e exclusão nas tabelas principais (quem fez, quando,
-- o que mudou), pra consulta exclusiva do admin. Acesso liberado só via
-- RLS de select; ninguém escreve direto na tabela, só o trigger.
-- ========================================================================

create table auditoria (
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

create index idx_auditoria_tabela on auditoria(tabela);
create index idx_auditoria_registro on auditoria(registro_id);
create index idx_auditoria_criado_em on auditoria(criado_em desc);

alter table auditoria enable row level security;

-- Só admin lê; ninguém tem insert/update/delete via RLS — só o trigger
-- abaixo grava, rodando como o dono da função (bypassa RLS).
create policy "auditoria_select_admin" on auditoria for select
  using (auth_papel() = 'admin');

-- Guarda o nome também (não só o id) pra manter legível mesmo se o
-- usuário for excluído depois.
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

-- Tabelas de registros que importam pra prestação de contas/accountability
-- — não inclui catálogos/tabelas de referência (tabela_valores, itens de
-- veículo, avaliadores, anexos) pra não poluir o histórico com dado que
-- não é decisão nem registro de fato.
create trigger trg_auditoria_diarias_solicitacoes
  after insert or update or delete on diarias_solicitacoes
  for each row execute function registrar_auditoria();

create trigger trg_auditoria_diarias_prestacoes_contas
  after insert or update or delete on diarias_prestacoes_contas
  for each row execute function registrar_auditoria();

create trigger trg_auditoria_diarias_prestacoes_pagamentos
  after insert or update or delete on diarias_prestacoes_pagamentos
  for each row execute function registrar_auditoria();

create trigger trg_auditoria_requerimentos_internos
  after insert or update or delete on requerimentos_internos
  for each row execute function registrar_auditoria();

create trigger trg_auditoria_requerimentos_reembolso
  after insert or update or delete on requerimentos_reembolso
  for each row execute function registrar_auditoria();

create trigger trg_auditoria_veiculos_locacao_solicitacoes
  after insert or update or delete on veiculos_locacao_solicitacoes
  for each row execute function registrar_auditoria();

create trigger trg_auditoria_decretos_titulo_honorario
  after insert or update or delete on decretos_titulo_honorario
  for each row execute function registrar_auditoria();

create trigger trg_auditoria_pessoas
  after insert or update or delete on pessoas
  for each row execute function registrar_auditoria();

create trigger trg_auditoria_usuarios
  after insert or update or delete on usuarios
  for each row execute function registrar_auditoria();

create trigger trg_auditoria_avaliacoes
  after insert or update or delete on avaliacoes
  for each row execute function registrar_auditoria();

notify pgrst, 'reload schema';
