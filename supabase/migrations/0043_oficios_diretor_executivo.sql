-- ========================================================================
-- Migration 0043: Ofícios do Diretor Executivo — aba separada de Ofícios
-- (Secretaria), restrita ao admin, pra emitir os ofícios assinados pelo
-- Diretor Executivo da Câmara (numeração e timbrado próprios: "OFÍCIO Nº
-- X/ANO/DE/CMN", diferente do "SEC/CMN" da Secretaria — ver
-- src/app/(print)/oficios-de/oficio-de-conteudo.tsx). Tabela própria (não
-- reaproveita "oficios") porque o layout, a numeração e o texto padrão são
-- de fato diferentes documentos, só compartilham o conceito de ofício.
--
-- Hoje só existe um usuário com papel=admin (o próprio Diretor Executivo),
-- então restringir por papel já restringe pra essa pessoa especificamente.
-- ========================================================================

create table oficios_diretor_executivo (
  id uuid primary key default gen_random_uuid(),

  numero text not null,
  ano integer not null,
  data_oficio date not null default current_date,

  destinatario_tratamento text not null default 'Ilustríssimo Senhor'
    check (destinatario_tratamento in (
      'Excelentíssimo Senhor', 'Excelentíssima Senhora',
      'Ilustríssimo Senhor', 'Ilustríssima Senhora'
    )),
  destinatario_nome text not null,
  destinatario_cargo text not null,
  destinatario_cidade_uf text,

  saudacao text not null default '',
  assunto text not null,
  corpo_texto text not null default '',

  criado_por uuid references usuarios(id),
  criado_em timestamptz default now(),

  unique (ano, numero)
);

create index idx_oficios_de_ano on oficios_diretor_executivo(ano);

alter table oficios_diretor_executivo enable row level security;

create policy "oficios_de_select" on oficios_diretor_executivo for select
  using (auth_papel() = 'admin');
create policy "oficios_de_insert" on oficios_diretor_executivo for insert
  with check (auth_papel() = 'admin');
create policy "oficios_de_update" on oficios_diretor_executivo for update
  using (auth_papel() = 'admin');
create policy "oficios_de_delete" on oficios_diretor_executivo for delete
  using (auth_papel() = 'admin');

-- ========================================================================
-- Anexos (mesmo padrão de oficios_anexos — 0028) — arquivo físico no
-- Storage, metadados aqui. Merge automático no PDF final é feito só pros
-- do tipo "pdf" (ver src/lib/pdf/anexos.ts:baixarAnexosOficioDEPdf).
-- ========================================================================

create table oficios_diretor_executivo_anexos (
  id uuid primary key default gen_random_uuid(),
  oficio_id uuid references oficios_diretor_executivo(id) on delete cascade not null,
  caminho text not null,
  nome_original text not null,
  tipo text not null check (tipo in ('imagem', 'pdf', 'word')),
  criado_por uuid references usuarios(id),
  criado_em timestamptz default now()
);

create index idx_oficios_de_anexos_oficio on oficios_diretor_executivo_anexos(oficio_id);

alter table oficios_diretor_executivo_anexos enable row level security;

create policy "oficios_de_anexos_select" on oficios_diretor_executivo_anexos for select
  using (auth_papel() = 'admin');
create policy "oficios_de_anexos_insert" on oficios_diretor_executivo_anexos for insert
  with check (auth_papel() = 'admin');
create policy "oficios_de_anexos_delete" on oficios_diretor_executivo_anexos for delete
  using (auth_papel() = 'admin');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'oficios-de-anexos',
  'oficios-de-anexos',
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

create policy "oficios_de_anexos_storage_select" on storage.objects for select
  using (bucket_id = 'oficios-de-anexos' and auth_papel() = 'admin');

create policy "oficios_de_anexos_storage_insert" on storage.objects for insert
  with check (bucket_id = 'oficios-de-anexos' and auth_papel() = 'admin');

create policy "oficios_de_anexos_storage_delete" on storage.objects for delete
  using (bucket_id = 'oficios-de-anexos' and auth_papel() = 'admin');

notify pgrst, 'reload schema';
