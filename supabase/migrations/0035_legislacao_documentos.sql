-- ========================================================================
-- Documentos de legislação municipal cadastrados manualmente no sistema —
-- pra leis/decretos/resoluções que não estão (ainda) no acervo do
-- leis.org/leismunicipais. Mesmo padrão de oficios_anexos (0028): metadados
-- na tabela, arquivo físico no Supabase Storage. Diferente de oficios_anexos,
-- aqui o documento É a entidade principal (não é anexo de outra coisa), por
-- isso carrega os próprios metadados de identificação (título/tipo/número/
-- ano) em vez de só nome_original.
-- ========================================================================

create table legislacao_documentos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  tipo text not null check (tipo in ('lei', 'decreto', 'resolucao', 'portaria', 'ato', 'outro')),
  numero text,
  ano integer,
  descricao text,
  caminho text not null,
  nome_original text not null,
  tipo_arquivo text not null check (tipo_arquivo in ('imagem', 'pdf', 'word')),
  criado_por uuid references usuarios(id),
  criado_em timestamptz default now()
);

create index idx_legislacao_documentos_ano on legislacao_documentos(ano);
create index idx_legislacao_documentos_tipo on legislacao_documentos(tipo);

alter table legislacao_documentos enable row level security;

-- Leitura liberada pra qualquer autenticado (é consulta pública de
-- legislação, mesmo espírito do link externo ao leis.org). Gerenciar
-- (inserir/excluir) segue a mesma regra de quem gerencia Ofícios/Decretos:
-- ordenador_despesa/admin.
create policy "legislacao_documentos_select" on legislacao_documentos for select
  using (auth.role() = 'authenticated');

create policy "legislacao_documentos_insert" on legislacao_documentos for insert
  with check (auth_papel() in ('ordenador_despesa', 'admin'));

create policy "legislacao_documentos_delete" on legislacao_documentos for delete
  using (auth_papel() in ('ordenador_despesa', 'admin'));

-- ========================================================================
-- Bucket de storage (privado — acesso só via policy). Mesmos tipos/limite
-- de oficios-anexos (PDF, Word, imagem — inclui imagem pra dar conta de
-- leis antigas só disponíveis como digitalização escaneada).
-- ========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'legislacao-documentos',
  'legislacao-documentos',
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

-- Convenção de caminho: "{documento_id}/{arquivo}" (id gerado no cliente
-- antes do upload, reaproveitado como id da linha ao inserir).

create policy "legislacao_documentos_storage_select" on storage.objects for select
  using (bucket_id = 'legislacao-documentos' and auth.role() = 'authenticated');

create policy "legislacao_documentos_storage_insert" on storage.objects for insert
  with check (bucket_id = 'legislacao-documentos' and auth_papel() in ('ordenador_despesa', 'admin'));

create policy "legislacao_documentos_storage_delete" on storage.objects for delete
  using (bucket_id = 'legislacao-documentos' and auth_papel() in ('ordenador_despesa', 'admin'));

notify pgrst, 'reload schema';
