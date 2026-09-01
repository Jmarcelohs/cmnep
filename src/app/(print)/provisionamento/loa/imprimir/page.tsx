import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { formatarMoeda } from "@/lib/pdf/formato";
import { agoraBrasilFormatado } from "@/lib/data-brasil";
import { PrintButton } from "../../../print-button";
import type { Database } from "@/lib/supabase/database.types";

type LinhaLoa = Database["public"]["Tables"]["loa_projecoes"]["Row"];

// Código orçamentário completo — mesma lógica de codigoCompletoLinha em
// loa-tab.tsx, só que sobre a linha crua do banco (esta página consulta
// o Supabase direto, mesma convenção de todo print/[id]/imprimir deste
// módulo — ver certidao-valor/page.tsx).
function codigoCompleto(l: LinhaLoa): string {
  return `${l.orgao_codigo}.${l.unidade_codigo}.${l.subfuncao_codigo}.${l.programa_codigo}.${l.projeto_atividade_codigo}.${l.elemento_codigo}.${l.fonte_codigo}`;
}

// "1001" -> "1.001" — mesma formatação de formatarCodigoAtividade em loa-tab.tsx.
function formatarAtividade(codigo: string): string {
  return codigo.length > 1 ? `${codigo.slice(0, 1)}.${codigo.slice(1)}` : codigo;
}

type Grupo = { codigo: string; nome: string; itens: LinhaLoa[]; subtotal: number };

function agruparPorAtividade(linhas: LinhaLoa[]): Grupo[] {
  const grupos = new Map<string, Grupo>();
  for (const linha of linhas) {
    const grupo = grupos.get(linha.projeto_atividade_codigo) ?? {
      codigo: linha.projeto_atividade_codigo,
      nome: linha.projeto_atividade_nome,
      itens: [],
      subtotal: 0,
    };
    grupo.itens.push(linha);
    grupo.subtotal += linha.valor_projetado;
    grupos.set(linha.projeto_atividade_codigo, grupo);
  }
  return Array.from(grupos.values()).sort((a, b) => a.codigo.localeCompare(b.codigo));
}

export default async function ImprimirLoaPage() {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") notFound();

  const supabase = await createClient();
  const { data: linhas } = await supabase
    .from("loa_projecoes")
    .select("*")
    .eq("ano", 2027)
    .order("orgao_codigo")
    .order("unidade_codigo")
    .order("projeto_atividade_codigo")
    .order("elemento_codigo");

  const grupos = agruparPorAtividade(linhas ?? []);
  const total = (linhas ?? []).reduce((soma, l) => soma + l.valor_projetado, 0);
  const geradoEm = agoraBrasilFormatado();

  return (
    <>
      <PrintButton url="/api/provisionamento/loa/pdf" nomeArquivoPadrao="proposta-loa-2027.pdf" />
      <div className="mx-auto w-[210mm] bg-white p-10 text-black print:w-full print:p-8">
        <h1 className="text-lg font-semibold">Proposta de Orçamento — LOA 2027</h1>
        <p className="mt-1 text-xs text-slate-500">Câmara Municipal de Nepomuceno — Gerado em {geradoEm}</p>
        <p className="mt-2 text-xs text-slate-600">
          Ferramenta de planejamento interno, partindo das dotações de 2026 — confira sempre com a
          contabilidade/controle interno antes de usar os valores num rascunho oficial da LOA.
        </p>

        {grupos.map((grupo) => (
          <div key={grupo.codigo} className="mt-6">
            <div className="flex items-baseline justify-between border-b border-slate-400 pb-1">
              <p className="text-sm font-semibold">
                <span className="font-mono text-xs text-slate-500">{formatarAtividade(grupo.codigo)}</span>{" "}
                {grupo.nome}
              </p>
              <p className="text-sm font-semibold">{formatarMoeda(grupo.subtotal)}</p>
            </div>
            <table className="mt-1 w-full border-collapse text-xs">
              <tbody>
                {grupo.itens.map((linha) => (
                  <tr key={linha.id} className="border-b border-slate-200">
                    <td className="w-1/3 py-1 pr-2 font-mono text-slate-500">{codigoCompleto(linha)}</td>
                    <td className="py-1 pr-2">{linha.elemento_nome}</td>
                    <td className="py-1 pr-2 text-slate-600">{linha.fonte_nome}</td>
                    <td className="py-1 text-right">{formatarMoeda(linha.valor_projetado)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
        {grupos.length === 0 && <p className="mt-6 text-sm text-slate-400">Nenhuma dotação na proposta.</p>}

        <div className="mt-8 flex justify-between border-t-2 border-slate-800 pt-2 text-sm font-semibold">
          <p>Total geral proposto</p>
          <p>{formatarMoeda(total)}</p>
        </div>
      </div>
    </>
  );
}
