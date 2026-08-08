-- ========================================================================
-- Migration 0034: modelos reutilizáveis de ofício — guarda só o conteúdo
-- que se repete (tipo, assunto, texto, fechamento), sem destinatário nem
-- autor (variam a cada envio). Alimenta o seletor rápido "Iniciar a partir
-- de um modelo" no formulário de Ofícios
-- (ver src/app/(app)/oficios/oficio-form.tsx).
-- ========================================================================

create table oficios_modelos (
  id uuid primary key default gen_random_uuid(),

  nome_modelo text not null,
  tipo text not null check (tipo in ('padrao','indicacao','requerimento','convite')),
  assunto text not null default '',
  corpo_texto text not null default '',
  paragrafo_fechamento text not null default '',

  criado_por uuid references usuarios(id),
  criado_em timestamptz default now()
);

alter table oficios_modelos enable row level security;

-- Mesma governança de Ofícios: quem pode criar ofício pode salvar modelo;
-- quem pode gerenciar/excluir ofício pode excluir modelo. Sem policy de
-- update — não tem tela de editar modelo, só excluir e salvar de novo.
create policy "oficios_modelos_select" on oficios_modelos for select
  using (auth.role() = 'authenticated');
create policy "oficios_modelos_insert" on oficios_modelos for insert
  with check (auth_papel() in ('admin','ordenador_despesa','servidor','estagiario'));
create policy "oficios_modelos_delete" on oficios_modelos for delete
  using (auth_papel() in ('admin','ordenador_despesa'));
