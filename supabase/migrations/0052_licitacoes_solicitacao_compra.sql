-- ========================================================================
-- Migration 0052: segundo documento do processo de Licitações —
-- Solicitação de Compra. No fluxo real, esse arquivo empacota, num PDF só:
-- a carta de Solicitação (pesquisa de preços), a Proposta Comercial em
-- branco (formulário pro fornecedor preencher), o Termo de Referência
-- completo e o Anexo I (documentação exigida) — confirmado com o usuário.
-- O TR também vira documento próprio nas fases seguintes do processo, por
-- isso 'tr' e 'solicitacao_compra' são tipos separados que compartilham o
-- mesmo gerador de conteúdo (ver src/lib/licitacoes/documento-tr.ts).
--
-- Anexo II (fotos/medidas das portas) NÃO é gerado automaticamente ainda —
-- precisaria de upload de imagem, fora de escopo por enquanto.
--
-- itens: lista de bens/serviços do processo (tabela "DEMANDA" que aparece
-- na Solicitação, na Proposta Comercial e no TR) — reaproveitada pelos 3.
-- valor_unitario/valor_global ficam null até a pesquisa de preço definir.
--
-- pesquisa_precos/gestor_contrato/fiscal_contrato: papéis adicionais do
-- processo, também referenciando pessoas (mesmo padrão de
-- organizador/agente_contratacao já existentes) — gestor/fiscal também
-- serão usados pelo futuro "Termo de Aceite de Gestor e Fiscal".
-- ========================================================================

alter table processos_licitatorios_documentos
  drop constraint processos_licitatorios_documentos_tipo_check;

alter table processos_licitatorios_documentos
  add constraint processos_licitatorios_documentos_tipo_check
  check (tipo in (
    'capa', 'dfd', 'etp', 'tr', 'certidao_valor', 'solicitacao_abertura',
    'termo_aceite', 'solicitacao_compra', 'solicitacao_orcamento', 'certidao_orcamento',
    'solicitacao_parecer_juridico', 'aviso', 'termo_aviso', 'ata_julgamento',
    'despacho', 'relatorio_publicacao', 'autuacao'
  ));

alter table processos_licitatorios
  add column pesquisa_precos_pessoa_id uuid references pessoas(id),
  add column gestor_contrato_pessoa_id uuid references pessoas(id),
  add column fiscal_contrato_pessoa_id uuid references pessoas(id);

create table processos_licitatorios_itens (
  id uuid primary key default gen_random_uuid(),
  processo_id uuid not null references processos_licitatorios(id) on delete cascade,
  numero_item integer not null,
  objeto text not null default '',
  unidade text not null default '',
  quantidade numeric(12, 2) not null default 1,
  valor_unitario numeric(14, 4),
  valor_global numeric(14, 4),
  criado_em timestamptz default now(),
  unique (processo_id, numero_item)
);

create index idx_processos_licitatorios_itens_processo on processos_licitatorios_itens(processo_id);

alter table processos_licitatorios_itens enable row level security;

create policy "processos_licitatorios_itens_select" on processos_licitatorios_itens for select
  using (auth_papel() in ('admin', 'ordenador_despesa', 'servidor'));
create policy "processos_licitatorios_itens_insert" on processos_licitatorios_itens for insert
  with check (auth_papel() in ('admin', 'ordenador_despesa', 'servidor'));
create policy "processos_licitatorios_itens_update" on processos_licitatorios_itens for update
  using (auth_papel() in ('admin', 'ordenador_despesa', 'servidor'));
create policy "processos_licitatorios_itens_delete" on processos_licitatorios_itens for delete
  using (auth_papel() in ('admin', 'ordenador_despesa', 'servidor'));

notify pgrst, 'reload schema';
