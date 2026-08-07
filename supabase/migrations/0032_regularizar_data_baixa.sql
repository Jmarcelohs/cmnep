-- ========================================================================
-- Regulariza data_baixa (coluna nova, 0031) nas 3 prestações de contas que
-- já tinham a baixa realmente dada antes da coluna existir.
--
-- "tesoureiro_nome" não serve de sinal aqui — tem valor padrão desde a
-- migration 0015 (preenchido em toda prestação, dada ou não a baixa). O
-- sinal real é a existência de pagamento em diarias_prestacoes_pagamentos.
-- Datas conferidas na tabela auditoria (INSERT em
-- diarias_prestacoes_pagamentos) quando disponível; a mais antiga (sem
-- registro de auditoria pra essa tabela ainda) usa a mesma data da
-- aprovação do ordenador/parecer dessa prestação, já que tudo foi decidido
-- no mesmo dia.
-- ========================================================================

update diarias_prestacoes_contas set data_baixa = '2026-07-27'
where id = 'f30ff838-b462-4f82-98df-9a2db4fb047f';

update diarias_prestacoes_contas set data_baixa = '2026-08-05'
where id = 'f272d8a1-c1ac-486b-931b-1f6d4b35d25a';

update diarias_prestacoes_contas set data_baixa = '2026-08-06'
where id = 'bbbaf35e-2e1e-4e65-83a9-75155264cd21';
