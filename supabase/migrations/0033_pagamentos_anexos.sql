-- ========================================================================
-- Comprovantes de pagamento da baixa — um anexo por linha de
-- diarias_prestacoes_pagamentos (uma prestação pode ter mais de uma baixa,
-- ex.: diária + reembolso vinculado, cada uma com seu próprio comprovante).
-- Mesmo padrão de diarias_prestacoes_anexos (0004): metadados na tabela,
-- arquivo físico no Storage.
-- ========================================================================

create table diarias_prestacoes_pagamentos_anexos (
  id uuid primary key default gen_random_uuid(),
  pagamento_id uuid references diarias_prestacoes_pagamentos(id) on delete cascade not null,
  caminho text not null,
  nome_original text not null,
  tipo text not null check (tipo in ('imagem', 'pdf')),
  criado_por uuid references usuarios(id),
  criado_em timestamptz default now()
);

create index idx_pagamentos_anexos_pagamento on diarias_prestacoes_pagamentos_anexos(pagamento_id);

alter table diarias_prestacoes_pagamentos_anexos enable row level security;

-- Leitura: mesmo público que já vê a prestação de contas (dono + papéis de
-- decisão + admin/gestor_diarias). Inserir/excluir: só quem pode dar baixa
-- (tesoureiro/admin/gestor_diarias) — o comprovante é anexado por quem
-- processa o pagamento, não pelo beneficiário da viagem.
create policy "pagamentos_anexos_select" on diarias_prestacoes_pagamentos_anexos for select
  using (
    exists (
      select 1 from diarias_prestacoes_pagamentos pp
      join diarias_prestacoes_contas pc on pc.id = pp.prestacao_id
      where pp.id = pagamento_id
        and (
          pc.pessoa_id = auth_pessoa_id()
          or auth_papel() in ('ordenador_despesa', 'controle_interno', 'tesoureiro', 'admin', 'gestor_diarias')
        )
    )
  );

create policy "pagamentos_anexos_insert" on diarias_prestacoes_pagamentos_anexos for insert
  with check (auth_papel() in ('tesoureiro', 'admin', 'gestor_diarias'));

create policy "pagamentos_anexos_delete" on diarias_prestacoes_pagamentos_anexos for delete
  using (auth_papel() in ('tesoureiro', 'admin', 'gestor_diarias'));

-- ========================================================================
-- Bucket de storage (privado). 10MB por arquivo, imagens + PDF — mesmo
-- limite dos outros anexos de diária.
-- ========================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pagamentos-anexos',
  'pagamentos-anexos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Convenção de caminho: "{pagamento_id}/{arquivo}".

create policy "pagamentos_anexos_storage_select" on storage.objects for select
  using (
    bucket_id = 'pagamentos-anexos'
    and exists (
      select 1 from diarias_prestacoes_pagamentos pp
      join diarias_prestacoes_contas pc on pc.id = pp.prestacao_id
      where pp.id::text = (storage.foldername(name))[1]
        and (
          pc.pessoa_id = auth_pessoa_id()
          or auth_papel() in ('ordenador_despesa', 'controle_interno', 'tesoureiro', 'admin', 'gestor_diarias')
        )
    )
  );

create policy "pagamentos_anexos_storage_insert" on storage.objects for insert
  with check (bucket_id = 'pagamentos-anexos' and auth_papel() in ('tesoureiro', 'admin', 'gestor_diarias'));

create policy "pagamentos_anexos_storage_delete" on storage.objects for delete
  using (bucket_id = 'pagamentos-anexos' and auth_papel() in ('tesoureiro', 'admin', 'gestor_diarias'));

notify pgrst, 'reload schema';
