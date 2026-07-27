-- ========================================================================
-- O tesoureiro da Câmara é sempre a mesma pessoa (Thuler Adriano Spuri) —
-- até agora "tesoureiro_nome" era preenchido com o nome de quem clicasse
-- em "Registrar" na baixa do pagamento, o que podia ser qualquer usuário
-- com acesso (ex.: admin agindo no lugar do tesoureiro). Passa a ter um
-- valor padrão fixo, no mesmo padrão já usado para "controle_interno_nome"
-- (migration 0001).
-- ========================================================================

alter table diarias_prestacoes_contas
  alter column tesoureiro_nome set default 'Thuler Adriano Spuri';

update diarias_prestacoes_contas
set tesoureiro_nome = 'Thuler Adriano Spuri'
where tesoureiro_nome is distinct from 'Thuler Adriano Spuri';
