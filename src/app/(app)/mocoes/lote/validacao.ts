// Arquivos "use server" só podem exportar funções async (viram endpoints
// de Server Action) — por isso a validação pura fica separada de
// actions.ts, pra poder ser testada sem esbarrar nessa restrição.
import type { TipoMocao, Tratamento } from "@/lib/supabase/database.types";

export type LinhaLoteMocao = {
  destinatario: string;
  destinatario_tratamento: Tratamento | null;
  justificativa: string;
};

// Valida os campos compartilhados + cada linha do lote. Retorna a
// mensagem de erro, ou null se estiver tudo certo.
export function validarLoteMocoes({
  tipo,
  data_mocao,
  autor_vereador_id,
  linhas,
}: {
  tipo: TipoMocao;
  data_mocao: string;
  autor_vereador_id: string;
  linhas: LinhaLoteMocao[];
}): string | null {
  if (!tipo || !data_mocao || !autor_vereador_id) {
    return "Preencha o tipo, a data e o autor";
  }
  if (linhas.length === 0) {
    return "Adicione ao menos um homenageado";
  }
  for (const [i, linha] of linhas.entries()) {
    if (!linha.destinatario.trim()) {
      return `Linha ${i + 1}: preencha o nome do homenageado`;
    }
    if (tipo === "pesar" && !linha.destinatario_tratamento) {
      return `Linha ${i + 1}: selecione o tratamento`;
    }
    if (tipo !== "pesar" && !linha.justificativa.trim()) {
      return `Linha ${i + 1}: preencha a justificativa`;
    }
  }
  return null;
}
