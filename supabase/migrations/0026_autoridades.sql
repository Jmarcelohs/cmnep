-- ========================================================================
-- Migration 0026: cadastro de autoridades (Poder Executivo, Ministério
-- Público etc.) pra quem a Câmara costuma endereçar ofícios — alimenta o
-- preenchimento rápido do bloco "Destinatário" no formulário de Ofícios
-- (ver src/app/(app)/oficios/oficio-form.tsx), evitando redigitar nome e
-- cargo toda vez.
-- ========================================================================

create table autoridades (
  id uuid primary key default gen_random_uuid(),

  tratamento text not null default 'Excelentíssimo Senhor'
    check (tratamento in ('Excelentíssimo Senhor','Excelentíssima Senhora')),
  nome text not null,
  cargo text not null,
  cidade_uf text,

  ativo boolean not null default true,
  criado_em timestamptz default now()
);

create index idx_autoridades_ativo on autoridades(ativo);

alter table autoridades enable row level security;

-- Qualquer usuário autenticado lê (precisa pro preenchimento rápido em
-- Ofícios); só admin cadastra/edita/exclui — mesma governança do cadastro
-- de Pessoas.
create policy "autoridades_select" on autoridades for select
  using (auth.role() = 'authenticated');
create policy "autoridades_insert" on autoridades for insert
  with check (auth_papel() = 'admin');
create policy "autoridades_update" on autoridades for update
  using (auth_papel() = 'admin');
create policy "autoridades_delete" on autoridades for delete
  using (auth_papel() = 'admin');

insert into autoridades (tratamento, nome, cargo, cidade_uf) values
  ('Excelentíssimo Senhor', 'Elias Natal Lima de Menezes', 'Prefeito Municipal de Nepomuceno', 'Nepomuceno/MG'),
  ('Excelentíssimo Senhor', 'José Maria de Oliveira', 'Vice-Prefeito Municipal de Nepomuceno', 'Nepomuceno/MG'),
  ('Excelentíssimo Senhor', 'Cleonaldo de Carvalho', 'Secretário Municipal da Fazenda', 'Nepomuceno/MG'),
  ('Excelentíssima Senhora', 'Paloma Dias Vilas Boas', 'Secretária Municipal de Planejamento', 'Nepomuceno/MG'),
  ('Excelentíssimo Senhor', 'Tulio Cesar Pedroso Penha', 'Secretário Municipal de Administração e Recursos Humanos', 'Nepomuceno/MG'),
  ('Excelentíssimo Senhor', 'Tulio Cesar Pedroso Penha', 'Secretário Municipal de Governo', 'Nepomuceno/MG'),
  ('Excelentíssimo Senhor', 'Bruno Henrique de Carvalho Marangoni', 'Controlador Geral do Município', 'Nepomuceno/MG'),
  ('Excelentíssima Senhora', 'Flaviane Vilas Boas Calixto', 'Procuradora Municipal', 'Nepomuceno/MG'),
  ('Excelentíssimo Senhor', 'Alexsander Gonçalves Pereira', 'Procurador Municipal', 'Nepomuceno/MG'),
  ('Excelentíssimo Senhor', 'Walas Silva de Novais', 'Procurador Municipal', 'Nepomuceno/MG'),
  ('Excelentíssima Senhora', 'Flávia Cintia de Oliveira Castro', 'Secretária Municipal de Desenvolvimento Social', 'Nepomuceno/MG'),
  ('Excelentíssima Senhora', 'Mariane de Souza Garcia', 'Secretária Municipal de Saúde', 'Nepomuceno/MG'),
  ('Excelentíssima Senhora', 'Larissa Spuri', 'Secretária Municipal de Educação', 'Nepomuceno/MG'),
  ('Excelentíssimo Senhor', 'Antônio Eduardo Memento', 'Secretário Municipal de Obras e Serviços Públicos', 'Nepomuceno/MG'),
  ('Excelentíssimo Senhor', 'Benedito Francisco de Paula Felisbino', 'Secretário Municipal de Agricultura e Meio Ambiente', 'Nepomuceno/MG'),
  ('Excelentíssima Senhora', 'Myrelle Naime', 'Secretária Municipal de Esportes, Cultura, Lazer e Turismo', 'Nepomuceno/MG');

notify pgrst, 'reload schema';
