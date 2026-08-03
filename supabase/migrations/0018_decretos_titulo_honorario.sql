-- ========================================================================
-- Migration 0018: Decretos Legislativos de Título de Cidadão Honorário —
-- aba para redigir/editar esses decretos com texto padronizado (mesma
-- estrutura de artigos usada nos projetos de decreto já emitidos pela
-- Câmara), gerando o PDF no timbrado oficial.
--
-- Número do decreto é digitado manualmente (não gerado por contador
-- atômico): a numeração de "Projeto de Decreto Legislativo" é única por
-- ano só na Câmara toda, compartilhada com outros assuntos além de título
-- honorário, que ainda não têm gestão nesta ferramenta — mesmo motivo
-- pelo qual número de diária/veículo também é editável (ver 0010).
-- ========================================================================

create table decretos_titulo_honorario (
  id uuid primary key default gen_random_uuid(),
  numero text not null,
  ano integer not null,
  data_decreto date not null default current_date,

  tratamento text not null default 'Sr.' check (tratamento in ('Sr.','Sra.')),
  nome_homenageado text not null,

  autor_nome text not null,
  autor_partido text,

  dotacao_orcamentaria text not null default '01.01.031.0001.2002.339031',
  justificativa text not null default '',

  criado_por uuid references usuarios(id),
  criado_em timestamptz default now(),

  unique (ano, numero)
);

create index idx_decretos_titulo_honorario_ano on decretos_titulo_honorario(ano);

alter table decretos_titulo_honorario enable row level security;

-- Qualquer usuário autenticado pode ler; só ordenador da despesa (que já
-- decide diárias/veículos nessa Câmara pequena) ou admin redige/edita.
create policy "decretos_titulo_honorario_select" on decretos_titulo_honorario for select
  using (auth.role() = 'authenticated');
create policy "decretos_titulo_honorario_insert" on decretos_titulo_honorario for insert
  with check (auth_papel() in ('ordenador_despesa','admin'));
create policy "decretos_titulo_honorario_update" on decretos_titulo_honorario for update
  using (auth_papel() in ('ordenador_despesa','admin'));
create policy "decretos_titulo_honorario_delete" on decretos_titulo_honorario for delete
  using (auth_papel() in ('ordenador_despesa','admin'));

notify pgrst, 'reload schema';
