import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { proximoNumero } from "@/lib/numeracao";
import { criarOficioDE } from "../actions";
import { OficioDEForm } from "../oficio-de-form";

export default async function NovoOficioDEPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/dashboard");

  const anoAtual = new Date().getFullYear();
  const supabase = await createClient();
  const { data: doAno } = await supabase
    .from("oficios_diretor_executivo")
    .select("numero")
    .eq("ano", anoAtual);

  // Sequência real já em uso pela Câmara antes dessa ferramenta existir —
  // 2026 continua a numeração manual que já ia até o nº 014 (ver pasta de
  // ofícios do Diretor Executivo), então o primeiro sugerido aqui é o 015.
  const numeroSugerido = String(
    proximoNumero(
      (doAno ?? []).map((r) => r.numero),
      anoAtual === 2026 ? 15 : 1,
    ),
  ).padStart(3, "0");

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Novo ofício — Diretor Executivo</h1>
      <p className="mt-1 text-sm text-slate-500">
        Número sugerido a partir do último emitido — confira antes de salvar.
      </p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <OficioDEForm
        action={criarOficioDE}
        valoresIniciais={{
          numero: numeroSugerido,
          data_oficio: "",
          destinatario_tratamento: "Ilustríssimo Senhor",
          destinatario_nome: "",
          destinatario_cargo: "",
          destinatario_cidade_uf: "",
          saudacao: "",
          assunto: "",
          corpo_texto: "",
        }}
      />
    </div>
  );
}
