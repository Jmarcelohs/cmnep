-- ========================================================================
-- Presença "quem está online" via polling HTTP, não Realtime/WebSocket.
--
-- Motivo: WebSocket (usado pela versão anterior, com Supabase Realtime)
-- se mostrou bloqueado em múltiplas redes brasileiras sem relação entre
-- si (internet da Câmara, duas operadoras de celular diferentes) — sintoma
-- comum de proxies de operadora que não lidam bem com WebSocket, mesmo
-- com HTTPS normal funcionando sem problema. Cada navegador agora avisa
-- periodicamente (a cada ~15s) que está ativo via um UPDATE HTTPS comum;
-- "online" = avisou nos últimos 30s.
-- ========================================================================

create table presenca_usuarios (
  usuario_id uuid primary key references usuarios(id) on delete cascade,
  ultima_atividade timestamptz not null default now()
);

alter table presenca_usuarios enable row level security;

-- Leitura liberada pra qualquer autenticado (mesmo espírito de
-- pessoas_select_authenticated) — só revela "quem está ativo agora",
-- nada mais sensível que o diretório de pessoas já não revele.
create policy "presenca_usuarios_select" on presenca_usuarios for select
  using (auth.role() = 'authenticated');

create policy "presenca_usuarios_insert" on presenca_usuarios for insert
  with check (usuario_id = auth_usuario_id());

create policy "presenca_usuarios_update" on presenca_usuarios for update
  using (usuario_id = auth_usuario_id())
  with check (usuario_id = auth_usuario_id());

notify pgrst, 'reload schema';
