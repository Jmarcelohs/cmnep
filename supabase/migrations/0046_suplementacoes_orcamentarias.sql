-- ========================================================================
-- Migration 0046: Suplementações Orçamentárias — abertura de crédito
-- adicional suplementar no orçamento da Câmara, sempre documentada em par:
-- um Ato da Mesa Diretora (assinado por Presidente/Vice-Presidente/
-- Secretário) e um Decreto do Executivo que o ratifica (assinado pelo
-- Prefeito). Módulo próprio — fora de Secretaria e Decretos, é movimento
-- orçamentário/contábil — restrito a admin (hoje só o próprio usuário
-- admin cadastrado).
--
-- dotacoes_orcamentarias: tabela de referência com as "fichas" do
-- orçamento vigente (importada da "Relação de Despesas" do sistema
-- contábil — ver seed abaixo), usada pra montar os artigos dos atos sem
-- redigitar a classificação orçamentária inteira toda vez. órgão/unidade/
-- subfunção/programa são praticamente fixos pra essa Câmara (um órgão, uma
-- unidade, uma subfunção) mas ficam como colunas normais (não constantes
-- no código) pra não travar se algum dia mudar.
-- ========================================================================

create table dotacoes_orcamentarias (
  id uuid primary key default gen_random_uuid(),

  ficha integer not null unique,

  orgao_codigo text not null,
  orgao_nome text not null,
  unidade_codigo text not null,
  unidade_nome text not null,
  subfuncao_codigo text not null,
  subfuncao_nome text not null,
  programa_codigo text not null,
  programa_nome text not null,
  projeto_atividade_codigo text not null,
  projeto_atividade_nome text not null,
  elemento_codigo text not null,
  elemento_nome text not null,
  fonte_codigo text not null,
  fonte_nome text not null,

  -- Referência do momento da importação/última edição — não é
  -- autoritativo (quem manda de verdade é o sistema contábil, Betha);
  -- só ajuda a conferir antes de montar uma suplementação nova.
  saldo_referencia numeric(14, 2),
  saldo_referencia_em date,

  ativo boolean not null default true,
  criado_em timestamptz default now()
);

create index idx_dotacoes_ficha on dotacoes_orcamentarias(ficha);

alter table dotacoes_orcamentarias enable row level security;

create policy "dotacoes_select" on dotacoes_orcamentarias for select
  using (auth_papel() = 'admin');
create policy "dotacoes_insert" on dotacoes_orcamentarias for insert
  with check (auth_papel() = 'admin');
create policy "dotacoes_update" on dotacoes_orcamentarias for update
  using (auth_papel() = 'admin');
create policy "dotacoes_delete" on dotacoes_orcamentarias for delete
  using (auth_papel() = 'admin');

-- ========================================================================
-- suplementacoes_orcamentarias: o "cabeçalho" da operação — data do Ato
-- (o Decreto reaproveita a mesma data, editável à parte só se divergir na
-- prática) e o número do Decreto, que é atribuído pela Prefeitura e por
-- isso fica em branco até ser preenchido depois de o Ato ser enviado.
-- ========================================================================

create table suplementacoes_orcamentarias (
  id uuid primary key default gen_random_uuid(),

  data_ato date not null,
  numero_decreto text,
  data_decreto date,

  criado_por uuid references usuarios(id),
  criado_em timestamptz default now()
);

alter table suplementacoes_orcamentarias enable row level security;

create policy "suplementacoes_select" on suplementacoes_orcamentarias for select
  using (auth_papel() = 'admin');
create policy "suplementacoes_insert" on suplementacoes_orcamentarias for insert
  with check (auth_papel() = 'admin');
create policy "suplementacoes_update" on suplementacoes_orcamentarias for update
  using (auth_papel() = 'admin');
create policy "suplementacoes_delete" on suplementacoes_orcamentarias for delete
  using (auth_papel() = 'admin');

-- ========================================================================
-- suplementacoes_itens: as linhas dos artigos 1º (destino — crédito
-- suplementar) e 2º (origem — anulação parcial) — cada uma referenciando
-- uma ficha e um valor. "ordem" define a ordem de exibição (numeral I, II,
-- III...) dentro de cada tipo.
-- ========================================================================

create table suplementacoes_itens (
  id uuid primary key default gen_random_uuid(),
  suplementacao_id uuid references suplementacoes_orcamentarias(id) on delete cascade not null,
  ficha_id uuid references dotacoes_orcamentarias(id) not null,
  tipo text not null check (tipo in ('destino', 'origem')),
  valor numeric(14, 2) not null check (valor > 0),
  ordem integer not null default 0,
  criado_em timestamptz default now()
);

create index idx_suplementacoes_itens_suplementacao on suplementacoes_itens(suplementacao_id);

alter table suplementacoes_itens enable row level security;

create policy "suplementacoes_itens_select" on suplementacoes_itens for select
  using (auth_papel() = 'admin');
create policy "suplementacoes_itens_insert" on suplementacoes_itens for insert
  with check (auth_papel() = 'admin');
create policy "suplementacoes_itens_update" on suplementacoes_itens for update
  using (auth_papel() = 'admin');
create policy "suplementacoes_itens_delete" on suplementacoes_itens for delete
  using (auth_papel() = 'admin');

-- ========================================================================
-- Seed: as 40 fichas da "Relação de Despesas" do exercício de 2026 (saldo
-- de referência na data de emissão do relatório, 12/08/2026). Órgão,
-- unidade, subfunção e programa são os mesmos em todas — só projeto/
-- atividade, elemento de despesa e o saldo variam por ficha.
-- ========================================================================

insert into dotacoes_orcamentarias (
  ficha, orgao_codigo, orgao_nome, unidade_codigo, unidade_nome,
  subfuncao_codigo, subfuncao_nome, programa_codigo, programa_nome,
  projeto_atividade_codigo, projeto_atividade_nome,
  elemento_codigo, elemento_nome, fonte_codigo, fonte_nome,
  saldo_referencia, saldo_referencia_em
) values
  (1, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '1001', 'Aquisição de Equipamentos e Materiais Permanentes e Veículos', '449051', 'Obras e Instalações', '1500', 'Recursos Ordinários', 10000.00, '2026-08-12'),
  (10, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '1001', 'Aquisição de Equipamentos e Materiais Permanentes e Veículos', '449052', 'Equipamentos e Material Permanente', '1500', 'Recursos Ordinários', 81204.00, '2026-08-12'),
  (2, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '1002', 'Aquisição de Equipamentos e Materiais Permanentes - Escola do Legislativo', '449052', 'Equipamentos e Material Permanente', '1500', 'Recursos Ordinários', 1000.00, '2026-08-12'),
  (3, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '1003', 'Aquisição de Equipamentos e Materiais Permanentes para o UAI', '449051', 'Obras e Instalações', '1500', 'Recursos Ordinários', 48250.00, '2026-08-12'),
  (11, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '1003', 'Aquisição de Equipamentos e Materiais Permanentes para o UAI', '449052', 'Equipamentos e Material Permanente', '1500', 'Recursos Ordinários', 250000.00, '2026-08-12'),
  (4, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2001', 'Manutenção das Atividades do Legislativo Municipal', '319004', 'Contratação por Tempo Determinado', '1500', 'Recursos Ordinários', 1000.00, '2026-08-12'),
  (5, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2001', 'Manutenção das Atividades do Legislativo Municipal', '319011', 'Vencimentos e Vantagens Fixas - Pessoal Civil', '1500', 'Recursos Ordinários', 948243.13, '2026-08-12'),
  (12, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2001', 'Manutenção das Atividades do Legislativo Municipal', '319013', 'Obrigações Patronais', '1500', 'Recursos Ordinários', 296145.50, '2026-08-12'),
  (13, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2001', 'Manutenção das Atividades do Legislativo Municipal', '319016', 'Outras Despesas Variáveis - Pessoal Civil', '1500', 'Recursos Ordinários', 1000.00, '2026-08-12'),
  (14, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2001', 'Manutenção das Atividades do Legislativo Municipal', '319094', 'Indenizações e Restituições Trabalhistas', '1500', 'Recursos Ordinários', 1000.00, '2026-08-12'),
  (15, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2001', 'Manutenção das Atividades do Legislativo Municipal', '339014', 'Diárias - Pessoal Civil', '1500', 'Recursos Ordinários', 43605.00, '2026-08-12'),
  (16, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2001', 'Manutenção das Atividades do Legislativo Municipal', '339030', 'Material de Consumo', '1500', 'Recursos Ordinários', 55353.92, '2026-08-12'),
  (17, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2001', 'Manutenção das Atividades do Legislativo Municipal', '339031', 'Premiações Culturais, Artísticas, Científicas', '1500', 'Recursos Ordinários', 25000.00, '2026-08-12'),
  (18, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2001', 'Manutenção das Atividades do Legislativo Municipal', '339032', 'Material, Bem ou Serviço para Distribuição Gratuita', '1500', 'Recursos Ordinários', 1000.00, '2026-08-12'),
  (19, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2001', 'Manutenção das Atividades do Legislativo Municipal', '339033', 'Passagens e Despesas com Locomoção', '1500', 'Recursos Ordinários', 27042.20, '2026-08-12'),
  (20, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2001', 'Manutenção das Atividades do Legislativo Municipal', '339035', 'Serviços de Consultoria', '1500', 'Recursos Ordinários', 37627.10, '2026-08-12'),
  (21, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2001', 'Manutenção das Atividades do Legislativo Municipal', '339036', 'Outros Serviços de Terceiros - Pessoa Física', '1500', 'Recursos Ordinários', 65128.10, '2026-08-12'),
  (22, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2001', 'Manutenção das Atividades do Legislativo Municipal', '339039', 'Outros Serviços de Terceiros - Pessoa Jurídica', '1500', 'Recursos Ordinários', 4601.86, '2026-08-12'),
  (23, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2001', 'Manutenção das Atividades do Legislativo Municipal', '339040', 'Serviços de Tecnologia da Informação e Comunicação', '1500', 'Recursos Ordinários', 37559.22, '2026-08-12'),
  (24, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2001', 'Manutenção das Atividades do Legislativo Municipal', '339046', 'Auxílio-Alimentação', '1500', 'Recursos Ordinários', 105521.68, '2026-08-12'),
  (25, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2001', 'Manutenção das Atividades do Legislativo Municipal', '339092', 'Despesas de Exercícios Anteriores', '1500', 'Recursos Ordinários', 2000.00, '2026-08-12'),
  (26, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2001', 'Manutenção das Atividades do Legislativo Municipal', '339093', 'Indenizações e Restituições', '1500', 'Recursos Ordinários', 1000.00, '2026-08-12'),
  (6, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2002', 'Manutenção da Escola do Legislativo e Parlamento Jovem', '339030', 'Material de Consumo', '1500', 'Recursos Ordinários', 2948.73, '2026-08-12'),
  (27, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2002', 'Manutenção da Escola do Legislativo e Parlamento Jovem', '339031', 'Premiações Culturais, Artísticas, Científicas', '1500', 'Recursos Ordinários', 2000.00, '2026-08-12'),
  (28, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2002', 'Manutenção da Escola do Legislativo e Parlamento Jovem', '339032', 'Material, Bem ou Serviço para Distribuição Gratuita', '1500', 'Recursos Ordinários', 2008.00, '2026-08-12'),
  (29, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2002', 'Manutenção da Escola do Legislativo e Parlamento Jovem', '339036', 'Outros Serviços de Terceiros - Pessoa Física', '1500', 'Recursos Ordinários', 14096.96, '2026-08-12'),
  (30, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2002', 'Manutenção da Escola do Legislativo e Parlamento Jovem', '339039', 'Outros Serviços de Terceiros - Pessoa Jurídica', '1500', 'Recursos Ordinários', 13473.71, '2026-08-12'),
  (31, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2002', 'Manutenção da Escola do Legislativo e Parlamento Jovem', '339040', 'Serviços de Tecnologia da Informação e Comunicação', '1500', 'Recursos Ordinários', 3000.00, '2026-08-12'),
  (32, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2002', 'Manutenção da Escola do Legislativo e Parlamento Jovem', '339093', 'Indenizações e Restituições', '1500', 'Recursos Ordinários', 1000.00, '2026-08-12'),
  (7, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2003', 'Manutenção das Atividades do UAI', '319004', 'Contratação por Tempo Determinado', '1500', 'Recursos Ordinários', 1000.00, '2026-08-12'),
  (8, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2003', 'Manutenção das Atividades do UAI', '319011', 'Vencimentos e Vantagens Fixas - Pessoal Civil', '1500', 'Recursos Ordinários', 539.38, '2026-08-12'),
  (33, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2003', 'Manutenção das Atividades do UAI', '319013', 'Obrigações Patronais', '1500', 'Recursos Ordinários', 1000.00, '2026-08-12'),
  (34, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2003', 'Manutenção das Atividades do UAI', '339030', 'Material de Consumo', '1500', 'Recursos Ordinários', 30000.00, '2026-08-12'),
  (35, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2003', 'Manutenção das Atividades do UAI', '339036', 'Outros Serviços de Terceiros - Pessoa Física', '1500', 'Recursos Ordinários', 27000.00, '2026-08-12'),
  (36, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2003', 'Manutenção das Atividades do UAI', '339039', 'Outros Serviços de Terceiros - Pessoa Jurídica', '1500', 'Recursos Ordinários', 212720.00, '2026-08-12'),
  (37, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2003', 'Manutenção das Atividades do UAI', '339040', 'Serviços de Tecnologia da Informação e Comunicação', '1500', 'Recursos Ordinários', 30000.00, '2026-08-12'),
  (9, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2077', 'Manutenção da Procuradoria da Mulher', '339030', 'Material de Consumo', '1500', 'Recursos Ordinários', 8000.00, '2026-08-12'),
  (38, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2077', 'Manutenção da Procuradoria da Mulher', '339032', 'Material, Bem ou Serviço para Distribuição Gratuita', '1500', 'Recursos Ordinários', 1515.00, '2026-08-12'),
  (39, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2077', 'Manutenção da Procuradoria da Mulher', '339036', 'Outros Serviços de Terceiros - Pessoa Física', '1500', 'Recursos Ordinários', 9000.00, '2026-08-12'),
  (40, '01', 'Legislativo Municipal', '01', 'Gabinete e Secretaria da Câmara', '031', 'Ação Legislativa', '0001', 'Atividades Legislativas', '2077', 'Manutenção da Procuradoria da Mulher', '339039', 'Outros Serviços de Terceiros - Pessoa Jurídica', '1500', 'Recursos Ordinários', 10000.00, '2026-08-12');

notify pgrst, 'reload schema';
