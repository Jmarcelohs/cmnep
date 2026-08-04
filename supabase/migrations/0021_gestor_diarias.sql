-- ========================================================================
-- Migration 0021: Novo papel "gestor_diarias" — se comporta como servidor
-- comum em todo o sistema, exceto em 3 módulos (Diárias de Viagem,
-- Reembolso, Veículos), onde tem acesso equivalente ao admin: vê todos os
-- registros (não só os próprios), autoriza/decide, edita e exclui
-- qualquer um, e no caso de Veículos também gerencia o catálogo do
-- pregão. Fora desses 3 módulos (Requerimentos Internos, Decretos,
-- Pessoas, Usuários, Avaliações, Auditoria), continua só com acesso de
-- servidor comum — sem elevação nenhuma.
-- ========================================================================

alter table usuarios drop constraint if exists usuarios_papel_check;
alter table usuarios add constraint usuarios_papel_check check (papel in (
  'admin',
  'servidor',
  'ordenador_despesa',
  'tesoureiro',
  'controle_interno',
  'gestor_diarias'
));

-- ------------------------------------------------------------------------
-- diarias_solicitacoes
-- ------------------------------------------------------------------------
drop policy if exists "diarias_solicitacoes_select" on diarias_solicitacoes;
create policy "diarias_solicitacoes_select" on diarias_solicitacoes for select
  using (
    pessoa_id = auth_pessoa_id()
    or auth_papel() in ('ordenador_despesa','controle_interno','tesoureiro','admin','gestor_diarias')
  );

drop policy if exists "diarias_solicitacoes_insert" on diarias_solicitacoes;
create policy "diarias_solicitacoes_insert" on diarias_solicitacoes for insert
  with check (
    pessoa_id = auth_pessoa_id() or auth_papel() in ('admin','gestor_diarias')
  );

drop policy if exists "diarias_solicitacoes_update" on diarias_solicitacoes;
create policy "diarias_solicitacoes_update" on diarias_solicitacoes for update
  using (
    auth_papel() in ('ordenador_despesa','admin','gestor_diarias')
    or pessoa_id = auth_pessoa_id()
  );

drop policy if exists "diarias_solicitacoes_delete" on diarias_solicitacoes;
create policy "diarias_solicitacoes_delete" on diarias_solicitacoes for delete
  using (
    auth_papel() in ('ordenador_despesa','admin','gestor_diarias')
    or pessoa_id = auth_pessoa_id()
  );

-- ------------------------------------------------------------------------
-- diarias_itens
-- ------------------------------------------------------------------------
drop policy if exists "diarias_itens_select" on diarias_itens;
create policy "diarias_itens_select" on diarias_itens for select
  using (
    exists (
      select 1 from diarias_solicitacoes s
      where s.id = solicitacao_id
        and (
          s.pessoa_id = auth_pessoa_id()
          or auth_papel() in ('ordenador_despesa','controle_interno','tesoureiro','admin','gestor_diarias')
        )
    )
  );

drop policy if exists "diarias_itens_write" on diarias_itens;
create policy "diarias_itens_write" on diarias_itens for insert
  with check (
    exists (
      select 1 from diarias_solicitacoes s
      where s.id = solicitacao_id
        and (s.pessoa_id = auth_pessoa_id() or auth_papel() in ('admin','gestor_diarias'))
    )
  );

drop policy if exists "diarias_itens_update" on diarias_itens;
create policy "diarias_itens_update" on diarias_itens for update
  using (
    exists (
      select 1 from diarias_solicitacoes s
      where s.id = solicitacao_id
        and (s.pessoa_id = auth_pessoa_id() or auth_papel() in ('admin','gestor_diarias'))
    )
  );

drop policy if exists "diarias_itens_delete" on diarias_itens;
create policy "diarias_itens_delete" on diarias_itens for delete
  using (
    exists (
      select 1 from diarias_solicitacoes s
      where s.id = solicitacao_id
        and (s.pessoa_id = auth_pessoa_id() or auth_papel() in ('admin','gestor_diarias'))
    )
  );

-- ------------------------------------------------------------------------
-- diarias_prestacoes_contas
-- ------------------------------------------------------------------------
drop policy if exists "diarias_prestacoes_select" on diarias_prestacoes_contas;
create policy "diarias_prestacoes_select" on diarias_prestacoes_contas for select
  using (
    pessoa_id = auth_pessoa_id()
    or auth_papel() in ('ordenador_despesa','controle_interno','tesoureiro','admin','gestor_diarias')
  );

drop policy if exists "diarias_prestacoes_insert" on diarias_prestacoes_contas;
create policy "diarias_prestacoes_insert" on diarias_prestacoes_contas for insert
  with check (
    pessoa_id = auth_pessoa_id() or auth_papel() in ('admin','gestor_diarias')
  );

drop policy if exists "diarias_prestacoes_update" on diarias_prestacoes_contas;
create policy "diarias_prestacoes_update" on diarias_prestacoes_contas for update
  using (
    pessoa_id = auth_pessoa_id()
    or auth_papel() in ('ordenador_despesa','controle_interno','tesoureiro','admin','gestor_diarias')
  );

drop policy if exists "diarias_prestacoes_delete" on diarias_prestacoes_contas;
create policy "diarias_prestacoes_delete" on diarias_prestacoes_contas for delete
  using (
    pessoa_id = auth_pessoa_id()
    or auth_papel() in ('ordenador_despesa', 'controle_interno', 'tesoureiro', 'admin', 'gestor_diarias')
  );

-- ------------------------------------------------------------------------
-- diarias_prestacoes_pagamentos
-- ------------------------------------------------------------------------
drop policy if exists "diarias_pagamentos_select" on diarias_prestacoes_pagamentos;
create policy "diarias_pagamentos_select" on diarias_prestacoes_pagamentos for select
  using (
    exists (
      select 1 from diarias_prestacoes_contas pc
      where pc.id = prestacao_id
        and (
          pc.pessoa_id = auth_pessoa_id()
          or auth_papel() in ('ordenador_despesa','controle_interno','tesoureiro','admin','gestor_diarias')
        )
    )
  );

drop policy if exists "diarias_pagamentos_write" on diarias_prestacoes_pagamentos;
create policy "diarias_pagamentos_write" on diarias_prestacoes_pagamentos for insert
  with check (auth_papel() in ('tesoureiro','admin','gestor_diarias'));

drop policy if exists "diarias_pagamentos_update" on diarias_prestacoes_pagamentos;
create policy "diarias_pagamentos_update" on diarias_prestacoes_pagamentos for update
  using (auth_papel() in ('tesoureiro','admin','gestor_diarias'));

drop policy if exists "diarias_pagamentos_delete" on diarias_prestacoes_pagamentos;
create policy "diarias_pagamentos_delete" on diarias_prestacoes_pagamentos for delete
  using (
    exists (
      select 1 from diarias_prestacoes_contas pc
      where pc.id = prestacao_id
        and (
          pc.pessoa_id = auth_pessoa_id()
          or auth_papel() in ('tesoureiro', 'admin', 'gestor_diarias')
        )
    )
  );

-- ------------------------------------------------------------------------
-- diarias_prestacoes_anexos (+ storage "prestacoes-anexos")
-- ------------------------------------------------------------------------
drop policy if exists "prestacoes_anexos_select" on diarias_prestacoes_anexos;
create policy "prestacoes_anexos_select" on diarias_prestacoes_anexos for select
  using (
    exists (
      select 1 from diarias_prestacoes_contas pc
      where pc.id = prestacao_id
        and (
          pc.pessoa_id = auth_pessoa_id()
          or auth_papel() in ('ordenador_despesa', 'controle_interno', 'tesoureiro', 'admin', 'gestor_diarias')
        )
    )
  );

drop policy if exists "prestacoes_anexos_insert" on diarias_prestacoes_anexos;
create policy "prestacoes_anexos_insert" on diarias_prestacoes_anexos for insert
  with check (
    exists (
      select 1 from diarias_prestacoes_contas pc
      where pc.id = prestacao_id
        and (pc.pessoa_id = auth_pessoa_id() or auth_papel() in ('admin', 'gestor_diarias'))
    )
  );

drop policy if exists "prestacoes_anexos_delete" on diarias_prestacoes_anexos;
create policy "prestacoes_anexos_delete" on diarias_prestacoes_anexos for delete
  using (
    exists (
      select 1 from diarias_prestacoes_contas pc
      where pc.id = prestacao_id
        and (pc.pessoa_id = auth_pessoa_id() or auth_papel() in ('admin', 'gestor_diarias'))
    )
  );

drop policy if exists "prestacoes_anexos_storage_select" on storage.objects;
create policy "prestacoes_anexos_storage_select" on storage.objects for select
  using (
    bucket_id = 'prestacoes-anexos'
    and exists (
      select 1 from diarias_prestacoes_contas pc
      where pc.id::text = (storage.foldername(name))[1]
        and (
          pc.pessoa_id = auth_pessoa_id()
          or auth_papel() in ('ordenador_despesa', 'controle_interno', 'tesoureiro', 'admin', 'gestor_diarias')
        )
    )
  );

drop policy if exists "prestacoes_anexos_storage_insert" on storage.objects;
create policy "prestacoes_anexos_storage_insert" on storage.objects for insert
  with check (
    bucket_id = 'prestacoes-anexos'
    and exists (
      select 1 from diarias_prestacoes_contas pc
      where pc.id::text = (storage.foldername(name))[1]
        and (pc.pessoa_id = auth_pessoa_id() or auth_papel() in ('admin', 'gestor_diarias'))
    )
  );

drop policy if exists "prestacoes_anexos_storage_delete" on storage.objects;
create policy "prestacoes_anexos_storage_delete" on storage.objects for delete
  using (
    bucket_id = 'prestacoes-anexos'
    and exists (
      select 1 from diarias_prestacoes_contas pc
      where pc.id::text = (storage.foldername(name))[1]
        and (pc.pessoa_id = auth_pessoa_id() or auth_papel() in ('admin', 'gestor_diarias'))
    )
  );

-- ------------------------------------------------------------------------
-- requerimentos_reembolso
-- ------------------------------------------------------------------------
drop policy if exists "requerimentos_reembolso_select" on requerimentos_reembolso;
create policy "requerimentos_reembolso_select" on requerimentos_reembolso for select
  using (
    pessoa_id = auth_pessoa_id()
    or auth_papel() in ('ordenador_despesa','admin','gestor_diarias')
  );

drop policy if exists "requerimentos_reembolso_insert" on requerimentos_reembolso;
create policy "requerimentos_reembolso_insert" on requerimentos_reembolso for insert
  with check (pessoa_id = auth_pessoa_id() or auth_papel() in ('admin','gestor_diarias'));

drop policy if exists "requerimentos_reembolso_update" on requerimentos_reembolso;
create policy "requerimentos_reembolso_update" on requerimentos_reembolso for update
  using (
    pessoa_id = auth_pessoa_id()
    or auth_papel() in ('ordenador_despesa','admin','gestor_diarias')
  );

drop policy if exists "requerimentos_reembolso_delete" on requerimentos_reembolso;
create policy "requerimentos_reembolso_delete" on requerimentos_reembolso for delete
  using (
    pessoa_id = auth_pessoa_id()
    or auth_papel() in ('ordenador_despesa','admin','gestor_diarias')
  );

-- ------------------------------------------------------------------------
-- requerimentos_reembolso_anexos (+ storage "reembolso-anexos")
-- ------------------------------------------------------------------------
drop policy if exists "reembolso_anexos_select" on requerimentos_reembolso_anexos;
create policy "reembolso_anexos_select" on requerimentos_reembolso_anexos for select
  using (
    exists (
      select 1 from requerimentos_reembolso r
      where r.id = requerimento_id
        and (r.pessoa_id = auth_pessoa_id() or auth_papel() in ('ordenador_despesa', 'admin', 'gestor_diarias'))
    )
  );

drop policy if exists "reembolso_anexos_insert" on requerimentos_reembolso_anexos;
create policy "reembolso_anexos_insert" on requerimentos_reembolso_anexos for insert
  with check (
    exists (
      select 1 from requerimentos_reembolso r
      where r.id = requerimento_id
        and (r.pessoa_id = auth_pessoa_id() or auth_papel() in ('admin', 'gestor_diarias'))
    )
  );

drop policy if exists "reembolso_anexos_delete" on requerimentos_reembolso_anexos;
create policy "reembolso_anexos_delete" on requerimentos_reembolso_anexos for delete
  using (
    exists (
      select 1 from requerimentos_reembolso r
      where r.id = requerimento_id
        and (r.pessoa_id = auth_pessoa_id() or auth_papel() in ('admin', 'gestor_diarias'))
    )
  );

drop policy if exists "reembolso_anexos_storage_select" on storage.objects;
create policy "reembolso_anexos_storage_select" on storage.objects for select
  using (
    bucket_id = 'reembolso-anexos'
    and exists (
      select 1 from requerimentos_reembolso r
      where r.id::text = (storage.foldername(name))[1]
        and (r.pessoa_id = auth_pessoa_id() or auth_papel() in ('ordenador_despesa', 'admin', 'gestor_diarias'))
    )
  );

drop policy if exists "reembolso_anexos_storage_insert" on storage.objects;
create policy "reembolso_anexos_storage_insert" on storage.objects for insert
  with check (
    bucket_id = 'reembolso-anexos'
    and exists (
      select 1 from requerimentos_reembolso r
      where r.id::text = (storage.foldername(name))[1]
        and (r.pessoa_id = auth_pessoa_id() or auth_papel() in ('admin', 'gestor_diarias'))
    )
  );

drop policy if exists "reembolso_anexos_storage_delete" on storage.objects;
create policy "reembolso_anexos_storage_delete" on storage.objects for delete
  using (
    bucket_id = 'reembolso-anexos'
    and exists (
      select 1 from requerimentos_reembolso r
      where r.id::text = (storage.foldername(name))[1]
        and (r.pessoa_id = auth_pessoa_id() or auth_papel() in ('admin', 'gestor_diarias'))
    )
  );

-- ------------------------------------------------------------------------
-- veiculos_locacao_itens (catálogo do pregão) e veiculos_locacao_solicitacoes
-- ------------------------------------------------------------------------
drop policy if exists "veiculos_locacao_itens_write_admin" on veiculos_locacao_itens;
create policy "veiculos_locacao_itens_write_admin" on veiculos_locacao_itens for insert
  with check (auth_papel() in ('admin','gestor_diarias'));

drop policy if exists "veiculos_locacao_itens_update_admin" on veiculos_locacao_itens;
create policy "veiculos_locacao_itens_update_admin" on veiculos_locacao_itens for update
  using (auth_papel() in ('admin','gestor_diarias'));

drop policy if exists "veiculos_locacao_insert" on veiculos_locacao_solicitacoes;
create policy "veiculos_locacao_insert" on veiculos_locacao_solicitacoes for insert
  with check (auth_papel() in ('ordenador_despesa','admin','gestor_diarias'));

drop policy if exists "veiculos_locacao_update" on veiculos_locacao_solicitacoes;
create policy "veiculos_locacao_update" on veiculos_locacao_solicitacoes for update
  using (auth_papel() in ('ordenador_despesa','admin','gestor_diarias'));

drop policy if exists "veiculos_locacao_delete" on veiculos_locacao_solicitacoes;
create policy "veiculos_locacao_delete" on veiculos_locacao_solicitacoes for delete
  using (auth_papel() in ('ordenador_despesa','admin','gestor_diarias'));

-- ------------------------------------------------------------------------
-- pessoas_dados_sensiveis (CPF) — leitura ampliada só pra não deixar o CPF
-- em branco nas telas de Diárias/Reembolso que o gestor_diarias já
-- enxerga por completo; escrita continua admin-only (fora de escopo).
-- ------------------------------------------------------------------------
drop policy if exists "pessoas_sensiveis_select" on pessoas_dados_sensiveis;
create policy "pessoas_sensiveis_select" on pessoas_dados_sensiveis for select
  using (
    auth_papel() in ('admin','ordenador_despesa','gestor_diarias')
    or pessoa_id = auth_pessoa_id()
  );

notify pgrst, 'reload schema';
