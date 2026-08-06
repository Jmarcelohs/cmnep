-- ========================================================================
-- Anexos (documentos de apoio) dos ofícios — PDF, Word e imagens. Mesmo
-- padrão de diarias_prestacoes_anexos (0004): metadados na tabela, arquivo
-- físico no Supabase Storage. Permissão de gerenciar (inserir/excluir)
-- segue a mesma regra de "quem pode editar o ofício" (0024): só
-- ordenador_despesa/admin — leitura é liberada pra qualquer autenticado,
-- igual à leitura do ofício em si.
-- ========================================================================

create table oficios_anexos (
  id uuid primary key default gen_random_uuid(),
  oficio_id uuid references oficios(id) on delete cascade not null,
  caminho text not null,
  nome_original text not null,
  tipo text not null check (tipo in ('imagem', 'pdf', 'word')),
  criado_por uuid references usuarios(id),
  criado_em timestamptz default now()
);

create index idx_oficios_anexos_oficio on oficios_anexos(oficio_id);

alter table oficios_anexos enable row level security;

create policy "oficios_anexos_select" on oficios_anexos for select
  using (auth.role() = 'authenticated');

create policy "oficios_anexos_insert" on oficios_anexos for insert
  with check (auth_papel() in ('ordenador_despesa', 'admin'));

create policy "oficios_anexos_delete" on oficios_anexos for delete
  using (auth_papel() in ('ordenador_despesa', 'admin'));

-- ========================================================================
-- Bucket de storage (privado — acesso só via policy). 15MB por arquivo
-- (limite maior que o de fotos de diária porque documentos Word/PDF de
-- apoio tendem a ser maiores), PDF + Word + imagens.
-- ========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'oficios-anexos',
  'oficios-anexos',
  false,
  15728640,
  array[
    'image/jpeg', 'image/png', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Convenção de caminho: "{oficio_id}/{arquivo}".

create policy "oficios_anexos_storage_select" on storage.objects for select
  using (bucket_id = 'oficios-anexos' and auth.role() = 'authenticated');

create policy "oficios_anexos_storage_insert" on storage.objects for insert
  with check (bucket_id = 'oficios-anexos' and auth_papel() in ('ordenador_despesa', 'admin'));

create policy "oficios_anexos_storage_delete" on storage.objects for delete
  using (bucket_id = 'oficios-anexos' and auth_papel() in ('ordenador_despesa', 'admin'));

notify pgrst, 'reload schema';
