-- ========================================================================
-- Migration 0050: contratos por unidade/serviço no Provisionamento
-- Orçamentário — cobre contratos que não têm um valor mensal fixo, e sim
-- um preço por unidade prestada (ex.: R$X por entrega de motoboy, R$Y por
-- km rodado de táxi/van, R$Z por publicação no jornal). O valor mensal
-- provisionado passa a ser preço unitário × quantidade estimada por mês,
-- em vez do valor_vigente direto — o resto do cálculo (reajuste
-- composto, vigência, situação) continua igual pras duas modalidades.
-- ========================================================================

alter table provisionamento_contratos
  alter column valor_vigente drop not null,
  alter column tipo_valor drop not null,
  add column modalidade text not null default 'fixo' check (modalidade in ('fixo', 'unidade')),
  add column valor_unitario numeric(14, 4),
  add column unidade_medida text,
  add column quantidade_estimada_mensal numeric(12, 2);

notify pgrst, 'reload schema';
