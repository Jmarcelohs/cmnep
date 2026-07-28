-- ========================================================================
-- Migration 0016: Gestor de Avaliações de Desempenho
--
-- Ciclo: 3 avaliações trimestrais + 1 anual por servidor/ano. Hoje só
-- existe o template "Estágio Probatório" (critérios/itens fixos, vivem
-- em código — src/lib/avaliacoes/template-estagio-probatorio.ts — não
-- em tabela, pois não são editáveis pelo usuário). A coluna `template`
-- já deixa a porta aberta pra um segundo modelo sem migrar dado antigo.
--
-- Avaliadores são cadastro à parte de `pessoas` (pode incluir gente que
-- não é servidor avaliado, ex: presidente/diretoria). `avaliadores` na
-- tabela de avaliações é snapshot (nome+matrícula) do momento do
-- lançamento, mesmo espírito de condutor_nome em veiculos_locacao —
-- editar o cadastro depois não deve alterar avaliações já registradas.
--
-- Acesso: dado de avaliação de desempenho é sensível (alimenta
-- progressão de carreira). Só admin lança/edita/exclui; leitura é
-- admin + o próprio servidor avaliado (via pessoas.usuario_id).
-- ========================================================================

create table avaliacoes_avaliadores (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  matricula text,
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Avaliadores do modelo de estágio probatório analisado ao desenhar essa
-- ferramenta (podem ser editados/inativados depois pela tela de cadastro).
-- Nome de "Vanilza" mantido como consta no documento de especificação
-- ("Vanilza L. S. Ricardino") — note que a matrícula 507 também aparece
-- no cadastro de servidores como "Vanilza de Lourdes Silva"; parece ser
-- a mesma pessoa com nome abreviado/divergente entre as duas listas do
-- documento original, mas não assumi a fusão — confirme e corrija aqui
-- se necessário.
insert into avaliacoes_avaliadores (nome, matricula) values
  ('João Marcelo Hipólito de Souza', '1106'),
  ('Vanilza L. S. Ricardino', '507'),
  ('Viviane Villas Boas Magrinelli', '1094'),
  ('Sônia Maria Ricardino', '1064');

create table avaliacoes (
  id uuid primary key default gen_random_uuid(),
  pessoa_id uuid not null references pessoas(id),
  ano integer not null,
  periodo text not null check (periodo in ('trimestre_1', 'trimestre_2', 'trimestre_3', 'anual')),
  template text not null default 'estagio_probatorio',
  data_avaliacao date not null default current_date,

  avaliadores jsonb not null default '[]'::jsonb,
  itens jsonb not null default '[]'::jsonb,

  pontos_melhorar text,
  pontos_positivos text,
  nota_final numeric(5, 2),

  criado_por uuid references usuarios(id),
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  unique (pessoa_id, ano, periodo, template)
);

create index idx_avaliacoes_pessoa on avaliacoes(pessoa_id);
create index idx_avaliacoes_ano on avaliacoes(ano);

alter table avaliacoes_avaliadores enable row level security;
alter table avaliacoes enable row level security;

create policy "avaliacoes_avaliadores_select" on avaliacoes_avaliadores for select
  using (auth_papel() = 'admin');
create policy "avaliacoes_avaliadores_insert_admin" on avaliacoes_avaliadores for insert
  with check (auth_papel() = 'admin');
create policy "avaliacoes_avaliadores_update_admin" on avaliacoes_avaliadores for update
  using (auth_papel() = 'admin');

create policy "avaliacoes_select" on avaliacoes for select
  using (auth_papel() = 'admin' or pessoa_id = auth_pessoa_id());
create policy "avaliacoes_insert" on avaliacoes for insert
  with check (auth_papel() = 'admin');
create policy "avaliacoes_update" on avaliacoes for update
  using (auth_papel() = 'admin');
create policy "avaliacoes_delete" on avaliacoes for delete
  using (auth_papel() = 'admin');

notify pgrst, 'reload schema';
