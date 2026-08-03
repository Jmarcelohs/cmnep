-- ========================================================================
-- Migration 0019: foto do homenageado no decreto de título de cidadão
-- honorário — um arquivo por decreto (bucket privado "decretos-fotos",
-- caminho "{decreto_id}/foto", sobrescrito a cada novo upload).
-- ========================================================================

alter table decretos_titulo_honorario add column foto_caminho text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'decretos-fotos',
  'decretos-fotos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Leitura liberada a qualquer autenticado (mesma regra de select da
-- tabela); upload/remoção só ordenador da despesa ou admin, mesma regra
-- de escrita da tabela decretos_titulo_honorario.
create policy "decretos_fotos_storage_select" on storage.objects for select
  using (bucket_id = 'decretos-fotos' and auth.role() = 'authenticated');

create policy "decretos_fotos_storage_insert" on storage.objects for insert
  with check (bucket_id = 'decretos-fotos' and auth_papel() in ('ordenador_despesa','admin'));

create policy "decretos_fotos_storage_update" on storage.objects for update
  using (bucket_id = 'decretos-fotos' and auth_papel() in ('ordenador_despesa','admin'));

create policy "decretos_fotos_storage_delete" on storage.objects for delete
  using (bucket_id = 'decretos-fotos' and auth_papel() in ('ordenador_despesa','admin'));

notify pgrst, 'reload schema';
