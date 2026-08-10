import type { createClient } from "@/lib/supabase/server";
import type { Papel, TipoMocao } from "@/lib/supabase/database.types";
import { buscarIdsPessoasPorNome, construirFiltroBusca } from "@/lib/busca";
import { LABEL_TIPO_MOCAO } from "@/lib/mocoes/documento";

export type ResultadoBusca = {
  id: string;
  titulo: string;
  subtitulo: string;
  href: string;
};

export type GrupoBusca = {
  titulo: string;
  itens: ResultadoBusca[];
};

export type BuscaGlobal = {
  grupos: GrupoBusca[];
  total: number;
};

const VAZIO: BuscaGlobal = { grupos: [], total: 0 };
const LIMITE_POR_MODULO = 8;

// Busca em todos os módulos de uma vez, server-rendered via GET — mesmo
// padrão de busca já usado em cada lista individual (src/lib/busca.ts),
// só que agregado. Replica exatamente os mesmos gates de papel que cada
// módulo já tem hoje (Diárias/Reembolsos/Veículos bloqueiam estagiário nos
// respectivos layouts; os outros 4 não têm bloqueio nenhum na lista) — não
// inventa restrição nova nem afrouxa as que já existem.
export async function buscarGlobal(
  supabase: Awaited<ReturnType<typeof createClient>>,
  usuario: { papel: Papel } | null | undefined,
  termo: string,
): Promise<BuscaGlobal> {
  const termoLimpo = termo.trim();
  if (termoLimpo.length < 2) return VAZIO;

  const veDiariasReembolsosVeiculos = usuario?.papel !== "estagiario";
  const idsPessoas = await buscarIdsPessoasPorNome(supabase, termoLimpo);

  const [diarias, reembolsos, internos, oficios, pessoas, decretos, mocoes, veiculos] = await Promise.all([
    veDiariasReembolsosVeiculos
      ? supabase
          .from("diarias_solicitacoes")
          .select("id, numero_diaria, numero_solicitacao, municipio_destino, pessoas(nome)")
          .or(construirFiltroBusca(termoLimpo, ["municipio_destino", "finalidade"], { coluna: "pessoa_id", ids: idsPessoas }))
          .limit(LIMITE_POR_MODULO)
      : Promise.resolve({ data: null }),
    veDiariasReembolsosVeiculos
      ? supabase
          .from("requerimentos_reembolso")
          .select("id, protocolo, municipio, pessoas(nome)")
          .or(construirFiltroBusca(termoLimpo, ["protocolo", "municipio"], { coluna: "pessoa_id", ids: idsPessoas }))
          .limit(LIMITE_POR_MODULO)
      : Promise.resolve({ data: null }),
    supabase
      .from("requerimentos_internos")
      .select("id, numero, ano, nome, assunto")
      .or(construirFiltroBusca(termoLimpo, ["nome", "assunto"]))
      .limit(LIMITE_POR_MODULO),
    supabase
      .from("oficios")
      .select("id, numero, ano, destinatario_nome, assunto")
      .or(construirFiltroBusca(termoLimpo, ["destinatario_nome", "assunto"]))
      .limit(LIMITE_POR_MODULO),
    supabase
      .from("pessoas")
      .select("id, nome, cargo, categoria")
      .or(construirFiltroBusca(termoLimpo, ["nome", "matricula", "cargo"]))
      .limit(LIMITE_POR_MODULO),
    supabase
      .from("decretos_titulo_honorario")
      .select("id, numero, ano, nome_homenageado")
      .or(construirFiltroBusca(termoLimpo, ["nome_homenageado", "autor_nome"]))
      .limit(LIMITE_POR_MODULO),
    supabase
      .from("mocoes")
      .select("id, tipo, destinatario, autor_nome")
      .or(construirFiltroBusca(termoLimpo, ["destinatario", "autor_nome"]))
      .limit(LIMITE_POR_MODULO),
    veDiariasReembolsosVeiculos
      ? supabase
          .from("veiculos_locacao_solicitacoes")
          .select("id, numero, ano, solicitante_nome, condutor_nome, veiculo_descricao")
          .or(construirFiltroBusca(termoLimpo, ["solicitante_nome", "condutor_nome", "veiculo_descricao"]))
          .limit(LIMITE_POR_MODULO)
      : Promise.resolve({ data: null }),
  ]);

  const grupos: GrupoBusca[] = [];

  const itensDiarias: ResultadoBusca[] = (diarias.data ?? []).map((d) => ({
    id: d.id,
    titulo: `Diária nº ${d.numero_diaria || d.numero_solicitacao || "—"}`,
    subtitulo: `${(d.pessoas as unknown as { nome: string } | null)?.nome ?? "—"} — ${d.municipio_destino}`,
    href: `/diarias/${d.id}`,
  }));
  if (itensDiarias.length > 0) grupos.push({ titulo: "Diárias", itens: itensDiarias });

  const itensReembolsos: ResultadoBusca[] = (reembolsos.data ?? []).map((r) => ({
    id: r.id,
    titulo: `Reembolso ${r.protocolo}`,
    subtitulo: `${(r.pessoas as unknown as { nome: string } | null)?.nome ?? "—"} — ${r.municipio}`,
    href: `/requerimentos/${r.id}`,
  }));
  if (itensReembolsos.length > 0) grupos.push({ titulo: "Reembolsos", itens: itensReembolsos });

  const itensInternos: ResultadoBusca[] = (internos.data ?? []).map((r) => ({
    id: r.id,
    titulo: `Requerimento ${r.numero}/${r.ano}`,
    subtitulo: `${r.nome} — ${r.assunto}`,
    href: `/requerimentos-internos/${r.id}`,
  }));
  if (itensInternos.length > 0) grupos.push({ titulo: "Requerimentos Internos", itens: itensInternos });

  const itensOficios: ResultadoBusca[] = (oficios.data ?? []).map((o) => ({
    id: o.id,
    titulo: `Ofício nº ${o.numero}/${o.ano}`,
    subtitulo: `${o.destinatario_nome} — ${o.assunto}`,
    href: `/oficios/${o.id}/editar`,
  }));
  if (itensOficios.length > 0) grupos.push({ titulo: "Ofícios", itens: itensOficios });

  const itensPessoas: ResultadoBusca[] = (pessoas.data ?? []).map((p) => ({
    id: p.id,
    titulo: p.nome,
    subtitulo: `${p.cargo} — ${p.categoria}`,
    href: `/pessoas/${p.id}/editar`,
  }));
  if (itensPessoas.length > 0) grupos.push({ titulo: "Pessoas", itens: itensPessoas });

  const itensDecretos: ResultadoBusca[] = (decretos.data ?? []).map((d) => ({
    id: d.id,
    titulo: `Decreto nº ${d.numero}/${d.ano}`,
    subtitulo: d.nome_homenageado,
    href: `/decretos/${d.id}/editar`,
  }));
  if (itensDecretos.length > 0) grupos.push({ titulo: "Decretos", itens: itensDecretos });

  const itensMocoes: ResultadoBusca[] = (mocoes.data ?? []).map((m) => ({
    id: m.id,
    titulo: LABEL_TIPO_MOCAO[m.tipo as TipoMocao],
    subtitulo: `${m.destinatario} — ${m.autor_nome}`,
    href: `/mocoes/${m.id}/editar`,
  }));
  if (itensMocoes.length > 0) grupos.push({ titulo: "Moções", itens: itensMocoes });

  const itensVeiculos: ResultadoBusca[] = (veiculos.data ?? []).map((v) => ({
    id: v.id,
    titulo: `Locação nº ${v.numero}/${v.ano}`,
    subtitulo: `${v.solicitante_nome} — ${v.veiculo_descricao}`,
    href: `/veiculos/${v.id}/editar`,
  }));
  if (itensVeiculos.length > 0) grupos.push({ titulo: "Veículos", itens: itensVeiculos });

  const total = grupos.reduce((acc, g) => acc + g.itens.length, 0);

  return { grupos, total };
}
