-- ========================================================================
-- Estado de decisão das solicitações de uso/empréstimo do Plenário —
-- pedidos vêm de um formulário do Google (respostas numa planilha
-- vinculada, lida ao vivo por src/lib/plenario/google-sheets.ts, nunca
-- espelhada aqui). Só o que não existe na planilha entra nesta tabela:
-- se foi aprovado/recusado, por quem, quando, e qual evento da Agenda
-- (Google Calendar) foi criado quando aprovado.
--
-- resposta_timestamp é o "Carimbo de data/hora" da linha da planilha —
-- chave natural da solicitação (o Google Forms garante unicidade por
-- envio), usada aqui em vez de um id próprio porque a fonte de verdade
-- do pedido em si é a planilha, não esta tabela.
-- ========================================================================

create table sessoes_plenario_decisoes (
  id uuid primary key default gen_random_uuid(),
  resposta_timestamp text not null unique,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado')),
  decidido_por uuid references usuarios(id),
  decidido_em date,
  evento_agenda_id text,
  criado_em timestamptz default now()
);

alter table sessoes_plenario_decisoes enable row level security;

-- Ver e decidir é restrito a admin/ordenador de despesa — os pedidos
-- trazem CPF/CNPJ e telefone de terceiros (público externo), mesmo
-- padrão de sensibilidade já aplicado ao CPF de pessoas cadastradas.
create policy "sessoes_plenario_select" on sessoes_plenario_decisoes for select
  using (auth_papel() in ('ordenador_despesa', 'admin'));

create policy "sessoes_plenario_insert" on sessoes_plenario_decisoes for insert
  with check (auth_papel() in ('ordenador_despesa', 'admin'));

create policy "sessoes_plenario_update" on sessoes_plenario_decisoes for update
  using (auth_papel() in ('ordenador_despesa', 'admin'))
  with check (auth_papel() in ('ordenador_despesa', 'admin'));

notify pgrst, 'reload schema';
