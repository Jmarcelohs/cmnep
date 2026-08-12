-- ========================================================================
-- Migration 0042: adiciona "Ilustríssimo Senhor"/"Ilustríssima Senhora"
-- como opções de tratamento em Ofícios (destinatário) e no cadastro de
-- Autoridades — até aqui só "Excelentíssimo(a)" era aceito, mas nem todo
-- destinatário de ofício (ex.: um particular, uma entidade, um cargo sem
-- foro de autoridade) recebe o tratamento de Excelência.
-- ========================================================================

alter table oficios drop constraint if exists oficios_destinatario_tratamento_check;
alter table oficios add constraint oficios_destinatario_tratamento_check
  check (destinatario_tratamento in (
    'Excelentíssimo Senhor', 'Excelentíssima Senhora',
    'Ilustríssimo Senhor', 'Ilustríssima Senhora'
  ));

alter table autoridades drop constraint if exists autoridades_tratamento_check;
alter table autoridades add constraint autoridades_tratamento_check
  check (tratamento in (
    'Excelentíssimo Senhor', 'Excelentíssima Senhora',
    'Ilustríssimo Senhor', 'Ilustríssima Senhora'
  ));
