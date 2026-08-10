"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import {
  criarEvento as criarEventoGoogle,
  editarEvento as editarEventoGoogle,
  excluirEvento as excluirEventoGoogle,
} from "@/lib/agenda/google-calendar";
import { podeExcluirEvento } from "@/lib/agenda/permissoes";

// Ver/inserir/editar é liberado pra qualquer usuário logado — agenda de
// equipe aberta (ver contexto do plano). Só excluir o compromisso de
// outra pessoa é restrito, checado à parte em excluirEvento.
async function exigirUsuarioLogado(redirectPath: string) {
  const usuario = await getCurrentUsuario();
  if (!usuario) redirect(redirectPath);
  return usuario;
}

function lerCampos(formData: FormData) {
  return {
    titulo: String(formData.get("titulo") ?? "").trim(),
    descricao: String(formData.get("descricao") ?? "").trim() || null,
    local: String(formData.get("local") ?? "").trim() || null,
    diaTodo: formData.get("dia_todo") === "1",
    inicio: String(formData.get("inicio") ?? ""),
    fim: String(formData.get("fim") ?? ""),
  };
}

export async function criarEvento(formData: FormData) {
  const usuario = await exigirUsuarioLogado("/agenda");
  const campos = lerCampos(formData);

  if (!campos.titulo || !campos.inicio || !campos.fim) {
    redirect(
      `/agenda/novo?error=${encodeURIComponent("Preencha o título e o período do compromisso")}`,
    );
  }

  try {
    await criarEventoGoogle({
      ...campos,
      criadoPorUsuarioId: usuario!.id,
      criadoPorNome: usuario!.nome,
    });
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Não foi possível criar o compromisso";
    redirect(`/agenda/novo?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath("/agenda");
  redirect(`/agenda?mes=${campos.inicio.slice(0, 7)}`);
}

export async function editarEvento(id: string, formData: FormData) {
  await exigirUsuarioLogado(`/agenda/${encodeURIComponent(id)}/editar`);
  const campos = lerCampos(formData);

  if (!campos.titulo || !campos.inicio || !campos.fim) {
    redirect(
      `/agenda/${encodeURIComponent(id)}/editar?error=${encodeURIComponent("Preencha o título e o período do compromisso")}`,
    );
  }

  try {
    await editarEventoGoogle(id, campos);
  } catch (err) {
    const mensagem =
      err instanceof Error ? err.message : "Não foi possível salvar as alterações";
    redirect(`/agenda/${encodeURIComponent(id)}/editar?error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath("/agenda");
  redirect(`/agenda?mes=${campos.inicio.slice(0, 7)}`);
}

// criadoPorUsuarioId e mes vêm "bind"ados na tela (mesmo padrão de
// excluirDecretoTituloHonorario.bind(null, id)) — a checagem de
// permissão roda de novo aqui no servidor (defesa em profundidade: a
// tela já esconde o botão de quem não pode, mas isso não impede uma
// chamada direta).
export async function excluirEvento(
  id: string,
  criadoPorUsuarioId: string | null,
  mes: string,
) {
  const usuario = await exigirUsuarioLogado("/agenda");

  if (!podeExcluirEvento(usuario!, { criadoPorUsuarioId })) {
    redirect(
      `/agenda?mes=${mes}&error=${encodeURIComponent("Você não tem permissão para excluir esse compromisso")}`,
    );
  }

  try {
    await excluirEventoGoogle(id);
  } catch (err) {
    const mensagem = err instanceof Error ? err.message : "Não foi possível excluir o compromisso";
    redirect(`/agenda?mes=${mes}&error=${encodeURIComponent(mensagem)}`);
  }

  revalidatePath("/agenda");
  redirect(`/agenda?mes=${mes}`);
}
