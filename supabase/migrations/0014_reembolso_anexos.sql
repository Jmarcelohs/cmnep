-- ========================================================================
-- Anexos (comprovantes) do requerimento de reembolso — mesma ideia da
-- migration 0004 (anexos da prestação de contas de diária): metadados
-- aqui, arquivo físico no Supabase Storage (bucket "reembolso-anexos").
-- Serve para comprovantes de abastecimento, estacionamento, passagens etc.
-- ========================================================================

create table requerimentos_reembolso_anexos (
  id uuid primary key default gen_random_uuid(),
  requerimento_id uuid references requerimentos_reembolso(id) on delete cascade not null,
  caminho text not null,
  nome_original text not null,
  tipo text not null check (tipo in ('imagem', 'pdf')),
  criado_por uuid references usuarios(id),
  criado_em timestamptz default now()
);

create index idx_reembolso_anexos_requerimento on requerimentos_reembolso_anexos(requerimento_id);

alter table requerimentos_reembolso_anexos enable row level security;

-- Mesma regra de acesso do requerimento em si: dono, ordenador da despesa
-- (que decide) e admin veem; só dono ou admin anexam/removem.
create policy "reembolso_anexos_select" on requerimentos_reembolso_anexos for select
  using (
    exists (
      select 1 from requerimentos_reembolso r
      where r.id = requerimento_id
        and (r.pessoa_id = auth_pessoa_id() or auth_papel() in ('ordenador_despesa', 'admin'))
    )
  );

create policy "reembolso_anexos_insert" on requerimentos_reembolso_anexos for insert
  with check (
    exists (
      select 1 from requerimentos_reembolso r
      where r.id = requerimento_id
        and (r.pessoa_id = auth_pessoa_id() or auth_papel() = 'admin')
    )
  );

create policy "reembolso_anexos_delete" on requerimentos_reembolso_anexos for delete
  using (
    exists (
      select 1 from requerimentos_reembolso r
      where r.id = requerimento_id
        and (r.pessoa_id = auth_pessoa_id() or auth_papel() = 'admin')
    )
  );

-- ========================================================================
-- Bucket de storage (privado), mesmas regras de tamanho/tipo do bucket de
-- anexos de diária.
-- ========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'reembolso-anexos',
  'reembolso-anexos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Convenção de caminho: "{requerimento_id}/{arquivo}".

create policy "reembolso_anexos_storage_select" on storage.objects for select
  using (
    bucket_id = 'reembolso-anexos'
    and exists (
      select 1 from requerimentos_reembolso r
      where r.id::text = (storage.foldername(name))[1]
        and (r.pessoa_id = auth_pessoa_id() or auth_papel() in ('ordenador_despesa', 'admin'))
    )
  );

create policy "reembolso_anexos_storage_insert" on storage.objects for insert
  with check (
    bucket_id = 'reembolso-anexos'
    and exists (
      select 1 from requerimentos_reembolso r
      where r.id::text = (storage.foldername(name))[1]
        and (r.pessoa_id = auth_pessoa_id() or auth_papel() = 'admin')
    )
  );

create policy "reembolso_anexos_storage_delete" on storage.objects for delete
  using (
    bucket_id = 'reembolso-anexos'
    and exists (
      select 1 from requerimentos_reembolso r
      where r.id::text = (storage.foldername(name))[1]
        and (r.pessoa_id = auth_pessoa_id() or auth_papel() = 'admin')
    )
  );

notify pgrst, 'reload schema';
