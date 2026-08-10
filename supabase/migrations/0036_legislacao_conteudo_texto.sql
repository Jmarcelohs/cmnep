-- ========================================================================
-- Busca por palavras dentro do conteúdo dos documentos de legislação
-- (0035) + download com nome de arquivo forçado. O texto extraído do PDF
-- é gravado aqui pelo servidor (rota /api/legislacao/[id]/extrair-texto,
-- chamada pelo cliente logo após o upload) e passa a entrar no mesmo
-- filtro de busca (ilike) já usado pra título/descrição/número — não é
-- full-text search (tsvector/GIN); o volume de documentos não justifica
-- essa complexidade a mais, mesmo raciocínio de outras buscas do sistema
-- (construirFiltroBusca, src/lib/busca.ts).
--
-- Só PDF é extraído por enquanto — Word e imagem continuam buscáveis só
-- por título/descrição/número (sem extração de texto nesta primeira
-- versão).
-- ========================================================================

alter table legislacao_documentos add column conteudo_texto text;

-- Não existia policy de update pra essa tabela (0035 só tinha
-- select/insert/delete) — precisa pra gravar conteudo_texto depois do
-- upload. Mesma regra de quem já gerencia o documento (insert/delete).
create policy "legislacao_documentos_update" on legislacao_documentos for update
  using (auth_papel() in ('ordenador_despesa', 'admin'))
  with check (auth_papel() in ('ordenador_despesa', 'admin'));

notify pgrst, 'reload schema';
