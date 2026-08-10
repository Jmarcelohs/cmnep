-- ========================================================================
-- Migration 0039: cadastro de Vereadores — alimenta a seleção de autor e
-- associados nas Moções (0040), com imagem de assinatura reutilizável por
-- vereador (colada automaticamente no PDF, ver mocao-conteudo.tsx). Mesma
-- governança do cadastro de Autoridades (0026): qualquer autenticado lê
-- (precisa pro preenchimento do formulário de Moções), só admin
-- cadastra/edita/exclui.
-- ========================================================================

create table vereadores (
  id uuid primary key default gen_random_uuid(),

  nome text not null,
  partido text,
  -- Concordância de gênero no texto das moções ("do vereador"/"da
  -- vereadora", "Vereador"/"Vereadora" na legenda da assinatura).
  genero text not null default 'Vereador' check (genero in ('Vereador', 'Vereadora')),
  -- Marca o Presidente atual da Câmara — decide se a legenda da
  -- assinatura na moção mostra "Presidente" em vez de "Vereador(a)", e
  -- coloca a assinatura dele sempre por último na grade (ver
  -- mocao-conteudo.tsx).
  presidente boolean not null default false,
  assinatura_caminho text,

  ativo boolean not null default true,
  criado_em timestamptz default now()
);

-- Nunca mais de um vereador marcado como Presidente ao mesmo tempo.
create unique index idx_vereadores_presidente_unico on vereadores (presidente) where presidente;
create index idx_vereadores_ativo on vereadores(ativo);

alter table vereadores enable row level security;

create policy "vereadores_select" on vereadores for select
  using (auth.role() = 'authenticated');
create policy "vereadores_insert" on vereadores for insert
  with check (auth_papel() = 'admin');
create policy "vereadores_update" on vereadores for update
  using (auth_papel() = 'admin');
create policy "vereadores_delete" on vereadores for delete
  using (auth_papel() = 'admin');

-- Vereadores já conhecidos pelo sistema (citados em decretos/comissões e
-- em moções reais já emitidas) — o restante da composição da Casa é
-- cadastrado depois pela tela /vereadores.
insert into vereadores (nome, partido, genero, presidente) values
  ('Tullio Ian Marangoni de Morais', null, 'Vereador', true),
  ('Mário Cezar Batista Leandro', 'PL', 'Vereador', false),
  ('Marcos Memento', 'PT', 'Vereador', false),
  ('Rogério de Paula Pedroso', 'PL', 'Vereador', false),
  ('Thuler Adriano Spuri', 'Avante', 'Vereador', false),
  ('Luciane Souza Lima', null, 'Vereadora', false),
  ('Elder Wander de Carvalho', null, 'Vereador', false),
  ('Vanessa Aguiar de Souza', null, 'Vereadora', false);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vereadores-assinaturas',
  'vereadores-assinaturas',
  false,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "vereadores_assinaturas_storage_select" on storage.objects for select
  using (bucket_id = 'vereadores-assinaturas' and auth.role() = 'authenticated');
create policy "vereadores_assinaturas_storage_insert" on storage.objects for insert
  with check (bucket_id = 'vereadores-assinaturas' and auth_papel() = 'admin');
create policy "vereadores_assinaturas_storage_update" on storage.objects for update
  using (bucket_id = 'vereadores-assinaturas' and auth_papel() = 'admin');
create policy "vereadores_assinaturas_storage_delete" on storage.objects for delete
  using (bucket_id = 'vereadores-assinaturas' and auth_papel() = 'admin');

notify pgrst, 'reload schema';
