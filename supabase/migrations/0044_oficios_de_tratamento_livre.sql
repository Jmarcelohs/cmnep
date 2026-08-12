-- ========================================================================
-- Migration 0044: destinatario_tratamento do Ofício do Diretor Executivo
-- vira texto livre, sem lista fixa de opções. Alguns ofícios reais são
-- endereçados a um setor/departamento do Executivo (ex.: "Departamento de
-- Arrecadação", ver ofícios nº 002/005/006/007/009/010/2026/DE/CMN), não a
-- uma pessoa física — nesses casos não existe tratamento tipo "Ilmo. Sr.".
-- Passa a guardar diretamente o texto que aparece depois de "Ao " no PDF
-- (ex.: "Ilmo. Sr.", "Ilma. Sra." ou vazio quando não se aplica).
-- ========================================================================

alter table oficios_diretor_executivo
  drop constraint if exists oficios_diretor_executivo_destinatario_tratamento_check;

alter table oficios_diretor_executivo
  alter column destinatario_tratamento set default 'Ilmo. Sr.';
