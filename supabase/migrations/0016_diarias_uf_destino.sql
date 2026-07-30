-- ========================================================================
-- Campo de UF (estado) do município de destino da diária — usado no nome
-- do arquivo do Anexo I gerado ("...Belo Horizonte_MG_..."). O campo
-- "Município Destino" já existente é só texto livre (nome da cidade),
-- sem estado separado.
-- ========================================================================

alter table diarias_solicitacoes add column uf_destino text;
