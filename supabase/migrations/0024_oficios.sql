-- ========================================================================
-- Migration 0024: Ofícios da Secretaria — ferramenta de preenchimento dos
-- ofícios oficiais da Câmara (padrão, indicação, requerimento, convite),
-- reproduzindo a estrutura comum (numeração, endereçamento, data, assunto,
-- fechamento) e o texto de abertura específico de cada tipo, no timbrado
-- oficial, sempre assinados pelo Presidente.
--
-- Numeração ("OFÍCIO Nº X/ANO/SEC/CMN") é única e sequencial por ano,
-- compartilhada entre os 4 tipos — mesma numeração real que a Câmara já usa
-- manualmente (ex.: Ofício nº 482/2026). Preenchimento manual (não há
-- contador atômico), mesmo motivo do número de decreto/diária/veículo: essa
-- ferramenta não é a única fonte da numeração real.
-- ========================================================================

create table oficios (
  id uuid primary key default gen_random_uuid(),

  tipo text not null check (tipo in ('padrao','indicacao','requerimento','convite')),
  numero text not null,
  ano integer not null,
  data_oficio date not null default current_date,

  destinatario_tratamento text not null default 'Excelentíssimo Senhor'
    check (destinatario_tratamento in ('Excelentíssimo Senhor','Excelentíssima Senhora')),
  destinatario_nome text not null,
  destinatario_cargo text not null,
  destinatario_cidade_uf text,

  saudacao text not null default '',
  assunto text not null,

  -- Autor/proponente citado no corpo do texto (indicação/requerimento
  -- sempre têm; padrão pode ter ou não — "por iniciativa do Vereador X" —
  -- convite não usa, é sempre institucional/Presidência). Nome e gênero
  -- gramatical guardados soltos (não FK) porque o texto já sai definitivo
  -- no PDF gerado — trocar o vereador depois não deve reescrever ofícios
  -- antigos.
  autor_nome text,
  autor_genero text check (autor_genero in ('Vereador','Vereadora')),

  -- Segundo proponente associado — usado em requerimentos com mais de um
  -- vereador ("com associação do Vereador Y").
  autor_associado_nome text,
  autor_associado_genero text check (autor_associado_genero in ('Vereador','Vereadora')),

  corpo_texto text not null default '',

  -- Só para convite: data/hora/local do evento, usados para gerar
  -- automaticamente a frase "O evento será realizado no dia ... às ... no ...".
  evento_data date,
  evento_hora text,
  evento_local text,

  paragrafo_fechamento text not null default
    'Certo de contar com a atenção e sensibilidade de Vossa Excelência, renovo votos de elevada estima e consideração.',

  criado_por uuid references usuarios(id),
  criado_em timestamptz default now(),

  unique (ano, numero)
);

create index idx_oficios_ano on oficios(ano);

alter table oficios enable row level security;

-- Qualquer usuário autenticado lê; criação liberada pra qualquer servidor
-- (mesmo padrão adotado pra decretos — ver 0023); edição/exclusão restritas
-- a admin/ordenador da despesa.
create policy "oficios_select" on oficios for select
  using (auth.role() = 'authenticated');
create policy "oficios_insert" on oficios for insert
  with check (auth_papel() in ('ordenador_despesa','admin','servidor'));
create policy "oficios_update" on oficios for update
  using (auth_papel() in ('ordenador_despesa','admin'));
create policy "oficios_delete" on oficios for delete
  using (auth_papel() in ('ordenador_despesa','admin'));

notify pgrst, 'reload schema';
