import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";

type Contato = {
  usuarioId: string;
  nome: string;
  cargo: string;
  ultimaMensagem: string | null;
  ultimaMensagemEm: string | null;
  naoLidas: number;
};

export default async function MensagensPage() {
  const usuario = await getCurrentUsuario();
  const supabase = await createClient();

  const [{ data: pessoas }, { data: mensagens }] = await Promise.all([
    supabase
      .from("pessoas")
      .select("nome, cargo, usuario_id")
      .not("usuario_id", "is", null)
      .eq("ativo", true)
      .order("nome"),
    usuario
      ? supabase
          .from("mensagens_diretas")
          .select("remetente_id, destinatario_id, conteudo, lida, criado_em")
          .or(`remetente_id.eq.${usuario.id},destinatario_id.eq.${usuario.id}`)
          .order("criado_em", { ascending: false })
      : Promise.resolve({ data: null }),
  ]);

  const porUsuarioId = new Map<string, { nome: string; cargo: string }>();
  for (const p of pessoas ?? []) {
    if (p.usuario_id && p.usuario_id !== usuario?.id) {
      porUsuarioId.set(p.usuario_id, { nome: p.nome, cargo: p.cargo });
    }
  }

  // Última mensagem e contagem de não lidas por "outro usuário" — a
  // consulta já vem ordenada da mais recente pra mais antiga, então a
  // primeira ocorrência de cada par é a última mensagem da conversa.
  const conversaPorContato = new Map<
    string,
    { ultimaMensagem: string; ultimaMensagemEm: string; naoLidas: number }
  >();
  for (const m of mensagens ?? []) {
    const outroId = m.remetente_id === usuario?.id ? m.destinatario_id : m.remetente_id;
    const existente = conversaPorContato.get(outroId);
    const lidaPendente = m.destinatario_id === usuario?.id && !m.lida;

    if (!existente) {
      conversaPorContato.set(outroId, {
        ultimaMensagem: m.conteudo,
        ultimaMensagemEm: m.criado_em,
        naoLidas: lidaPendente ? 1 : 0,
      });
    } else if (lidaPendente) {
      existente.naoLidas += 1;
    }
  }

  const contatos: Contato[] = Array.from(porUsuarioId.entries())
    .map(([usuarioId, dados]) => {
      const conversa = conversaPorContato.get(usuarioId);
      return {
        usuarioId,
        nome: dados.nome,
        cargo: dados.cargo,
        ultimaMensagem: conversa?.ultimaMensagem ?? null,
        ultimaMensagemEm: conversa?.ultimaMensagemEm ?? null,
        naoLidas: conversa?.naoLidas ?? 0,
      };
    })
    .sort((a, b) => {
      if (a.ultimaMensagemEm && b.ultimaMensagemEm) {
        return a.ultimaMensagemEm < b.ultimaMensagemEm ? 1 : -1;
      }
      if (a.ultimaMensagemEm) return -1;
      if (b.ultimaMensagemEm) return 1;
      return a.nome.localeCompare(b.nome);
    });

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Mensagens</h1>
      <p className="mt-1 text-sm text-slate-500">Converse diretamente com outros usuários do sistema.</p>

      <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {contatos.map((c) => (
          <Link
            key={c.usuarioId}
            href={`/mensagens/${c.usuarioId}`}
            className="flex items-center justify-between border-b border-slate-100 px-4 py-3 last:border-b-0 hover:bg-slate-50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{c.nome}</p>
              <p className="truncate text-xs text-slate-500">{c.ultimaMensagem ?? c.cargo}</p>
            </div>
            {c.naoLidas > 0 && (
              <span className="ml-3 shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                {c.naoLidas}
              </span>
            )}
          </Link>
        ))}
        {contatos.length === 0 && (
          <p className="px-4 py-6 text-center text-sm text-slate-400">Nenhum outro usuário cadastrado.</p>
        )}
      </div>
    </div>
  );
}
