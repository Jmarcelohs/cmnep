"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { createClient } from "@/lib/supabase/server";
import { hojeBrasil } from "@/lib/data-brasil";
import { listarSolicitacoesPlenario } from "@/lib/plenario/google-sheets";
import { numerarSolicitacoes } from "@/lib/plenario/numeracao";
import { criarEvento } from "@/lib/agenda/google-calendar";

async function exigirOrdenadorOuAdmin(redirectPath: string) {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin" && usuario?.papel !== "ordenador_despesa") {
    redirect(redirectPath);
  }
  return usuario;
}

// Sempre re-busca a solicitação na planilha em vez de confiar em dado
// vindo do HTML pra montar o evento — a única entrada do formulário é
// respostaTimestamp (usado só como chave), tudo o mais vem direto da
// fonte de verdade no momento da decisão.
export async function aprovarSolicitacaoPlenario(respostaTimestamp: string) {
  const usuario = await exigirOrdenadorOuAdmin("/plenario");

  const solicitacoes = await listarSolicitacoesPlenario();
  const solicitacao = solicitacoes.find((s) => s.respostaTimestamp === respostaTimestamp);
  if (!solicitacao) {
    redirect(`/plenario?error=${encodeURIComponent("Solicitação não encontrada na planilha")}`);
  }
  // Número sequencial calculado por nós (ver src/lib/plenario/numeracao.ts)
  // — a planilha só tem "Número do Requerimento" preenchido em parte dos
  // pedidos, então esse é o número de referência de verdade do sistema.
  const numero = numerarSolicitacoes(solicitacoes).get(respostaTimestamp) ?? "";

  const supabase = await createClient();

  try {
    const eventoId = await criarEvento({
      titulo: `Uso do Plenário nº ${numero} — ${solicitacao!.instituicao || solicitacao!.nomeSolicitante}`,
      descricao: [
        `Finalidade: ${solicitacao!.finalidade}`,
        `Tipo de evento: ${solicitacao!.tipoEvento}`,
        solicitacao!.numeroParticipantes &&
          `Participantes estimados: ${solicitacao!.numeroParticipantes}`,
        solicitacao!.equipamentos && `Equipamentos: ${solicitacao!.equipamentos}`,
        `Solicitante: ${solicitacao!.nomeSolicitante} — CPF/CNPJ ${solicitacao!.cpfCnpj} — tel. ${solicitacao!.telefone}`,
      ]
        .filter(Boolean)
        .join("\n"),
      local: "Plenário da Câmara Municipal de Nepomuceno",
      diaTodo: false,
      inicio: `${solicitacao!.dataDesejada}T${solicitacao!.horaInicio}`,
      fim: `${solicitacao!.dataDesejada}T${solicitacao!.horaFim}`,
      criadoPorUsuarioId: usuario!.id,
      criadoPorNome: usuario!.nome,
    });

    const { error } = await supabase.from("sessoes_plenario_decisoes").upsert(
      {
        resposta_timestamp: respostaTimestamp,
        status: "aprovado",
        decidido_por: usuario!.id,
        decidido_em: hojeBrasil(),
        evento_agenda_id: eventoId,
      },
      { onConflict: "resposta_timestamp" },
    );
    if (error) throw error;
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Não foi possível aprovar a solicitação";
    redirect(`/plenario?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath("/plenario");
  revalidatePath("/agenda");
  redirect("/plenario?aba=aprovadas");
}

export async function recusarSolicitacaoPlenario(respostaTimestamp: string) {
  const usuario = await exigirOrdenadorOuAdmin("/plenario");
  const supabase = await createClient();

  const { error } = await supabase.from("sessoes_plenario_decisoes").upsert(
    {
      resposta_timestamp: respostaTimestamp,
      status: "recusado",
      decidido_por: usuario!.id,
      decidido_em: hojeBrasil(),
    },
    { onConflict: "resposta_timestamp" },
  );

  revalidatePath("/plenario");

  if (error) {
    redirect(`/plenario?error=${encodeURIComponent("Não foi possível recusar: " + error.message)}`);
  }

  redirect("/plenario?aba=recusadas");
}
