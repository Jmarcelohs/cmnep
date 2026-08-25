-- ========================================================================
-- Migration 0051: módulo de Licitações — processos administrativos de
-- contratação (dispensa, inexigibilidade, pregão) e os documentos que os
-- compõem (capa, DFD, ETP, TR, certidões, etc.).
--
-- Um processo é o registro central (número do procedimento + número da
-- modalidade, objeto, dotação, pessoas envolvidas) — os documentos não
-- têm numeração própria, só referenciam os dados do processo (confirmado
-- com o usuário). Cada documento é gerado automaticamente a partir dos
-- dados do processo, num corpo em HTML editável (mesmo padrão de Ofícios),
-- pra permitir ajuste fino antes de imprimir sem depender de eu acertar
-- 100% a redação logo de cara.
--
-- genero em pessoas: usado só pra concordância de gênero no texto gerado
-- (ex.: "designada pelo agente de contratação...") — nullable porque não
-- se aplica/não é conhecido pra todo cadastro existente.
-- ========================================================================

alter table pessoas
  add column genero text check (genero in ('M', 'F'));

create table processos_licitatorios (
  id uuid primary key default gen_random_uuid(),

  numero_processo integer not null,
  ano integer not null,
  modalidade text not null check (modalidade in ('dispensa', 'inexigibilidade', 'pregao')),
  numero_modalidade integer not null,

  data_abertura date not null default current_date,
  objeto text not null default '',

  ficha_id uuid references dotacoes_orcamentarias(id),
  -- Complemento que a tabela de fichas não guarda (ex.: "3.3.90.39.48 –
  -- Serviços Gráficos") — texto livre por processo (confirmado com o
  -- usuário, ao menos por enquanto).
  dotacao_subelemento text not null default '',

  vinculo_pca text not null default '',

  organizador_pessoa_id uuid references pessoas(id),
  agente_contratacao_pessoa_id uuid references pessoas(id),

  criado_por uuid references usuarios(id),
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now(),

  unique (ano, numero_processo),
  unique (ano, modalidade, numero_modalidade)
);

create table processos_licitatorios_documentos (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processos_licitatorios(id) on delete cascade,
  tipo text not null check (tipo in (
    'capa', 'dfd', 'etp', 'tr', 'certidao_valor', 'solicitacao_abertura',
    'termo_aceite', 'solicitacao_orcamento', 'certidao_orcamento',
    'solicitacao_parecer_juridico', 'aviso', 'termo_aviso', 'ata_julgamento',
    'despacho', 'relatorio_publicacao', 'autuacao'
  )),
  corpo_html text not null default '',
  criado_por uuid references usuarios(id),
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now(),
  unique (processo_id, tipo)
);

create index idx_processos_licitatorios_documentos_processo on processos_licitatorios_documentos(processo_id);

alter table processos_licitatorios enable row level security;
alter table processos_licitatorios_documentos enable row level security;

-- Acesso liberado pra admin/ordenador de despesa/servidor (confirmado com
-- o usuário) — exclusão mais restrita, pra evitar apagar sem querer um
-- registro de processo administrativo já em andamento.
create policy "processos_licitatorios_select" on processos_licitatorios for select
  using (auth_papel() in ('admin', 'ordenador_despesa', 'servidor'));
create policy "processos_licitatorios_insert" on processos_licitatorios for insert
  with check (auth_papel() in ('admin', 'ordenador_despesa', 'servidor'));
create policy "processos_licitatorios_update" on processos_licitatorios for update
  using (auth_papel() in ('admin', 'ordenador_despesa', 'servidor'));
create policy "processos_licitatorios_delete" on processos_licitatorios for delete
  using (auth_papel() in ('admin', 'ordenador_despesa'));

create policy "processos_licitatorios_documentos_select" on processos_licitatorios_documentos for select
  using (auth_papel() in ('admin', 'ordenador_despesa', 'servidor'));
create policy "processos_licitatorios_documentos_insert" on processos_licitatorios_documentos for insert
  with check (auth_papel() in ('admin', 'ordenador_despesa', 'servidor'));
create policy "processos_licitatorios_documentos_update" on processos_licitatorios_documentos for update
  using (auth_papel() in ('admin', 'ordenador_despesa', 'servidor'));
create policy "processos_licitatorios_documentos_delete" on processos_licitatorios_documentos for delete
  using (auth_papel() in ('admin', 'ordenador_despesa'));

notify pgrst, 'reload schema';
