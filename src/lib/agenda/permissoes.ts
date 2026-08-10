import type { Papel } from "@/lib/supabase/database.types";
import type { EventoAgenda } from "./google-calendar";

// Qualquer usuário logado pode ver/inserir/editar compromissos — agenda
// de equipe aberta. Excluir o compromisso de outra pessoa fica restrito
// a admin/ordenador de despesa; quem criou sempre pode excluir o próprio,
// mesmo sem esses papéis.
export function podeExcluirEvento(
  usuario: { id: string; papel: Papel },
  evento: Pick<EventoAgenda, "criadoPorUsuarioId">,
): boolean {
  if (usuario.papel === "admin" || usuario.papel === "ordenador_despesa") return true;
  return evento.criadoPorUsuarioId === usuario.id;
}
