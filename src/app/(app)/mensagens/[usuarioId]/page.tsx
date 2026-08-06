import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { MensagemThread } from "./mensagem-thread";

export default async function ConversaPage({
  params,
}: {
  params: Promise<{ usuarioId: string }>;
}) {
  const { usuarioId } = await params;
  const usuario = await getCurrentUsuario();
  const supabase = await createClient();

  const [{ data: pessoaOutro }, { data: mensagens }] = await Promise.all([
    supabase.from("pessoas").select("nome, cargo").eq("usuario_id", usuarioId).maybeSingle(),
    usuario
      ? supabase
          .from("mensagens_diretas")
          .select("id, remetente_id, destinatario_id, conteudo, lida, criado_em")
          .or(
            `and(remetente_id.eq.${usuario.id},destinatario_id.eq.${usuarioId}),and(remetente_id.eq.${usuarioId},destinatario_id.eq.${usuario.id})`,
          )
          .order("criado_em", { ascending: true })
      : Promise.resolve({ data: null }),
  ]);

  if (!pessoaOutro || !usuario) notFound();

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
        <Link href="/mensagens" className="text-sm text-slate-500 hover:text-brand-navy">
          ← Mensagens
        </Link>
        <div>
          <h1 className="text-base font-semibold text-brand-navy">{pessoaOutro.nome}</h1>
          <p className="text-xs text-slate-500">{pessoaOutro.cargo}</p>
        </div>
      </div>

      <MensagemThread
        mensagensIniciais={mensagens ?? []}
        meuUsuarioId={usuario.id}
        outroUsuarioId={usuarioId}
        outroNome={pessoaOutro.nome}
      />
    </div>
  );
}
