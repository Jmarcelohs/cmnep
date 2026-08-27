// Ferramenta de manutenção — NÃO faz parte do app, não é acionada por
// nenhuma rota. Rodada manualmente sempre que o usuário pede a
// atualização do Painel de Orçamento (ver src/app/(app)/orcamento):
//
//   1. Abrir o Betha (Claude in Chrome), rodar o relatório "Ficha
//      Orçamentária" pro período do exercício corrente, entidade Câmara.
//   2. Baixar o PDF resultante e extrair o texto:
//      "C:\Program Files\Git\mingw64\bin\pdftotext.exe" -layout -enc UTF-8 relatorio.pdf relatorio.txt
//   3. node scripts/atualizar-orcamento.ts relatorio.txt
//
// Casa cada ficha extraída do relatório com uma linha já cadastrada em
// dotacoes_orcamentarias pelos códigos (projeto_atividade/elemento/fonte)
// — ver o comentário em src/lib/orcamento/parse-ficha-orcamentaria.ts pra
// entender por que é por código e não por nome. Ficha sem correspondência
// (ou com mais de uma) vira aviso, não erro — a atualização segue pras
// demais fichas.
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { parseFichaOrcamentaria } from "../src/lib/orcamento/parse-ficha-orcamentaria.ts";
import type { Database } from "../src/lib/supabase/database.types.ts";

function carregarEnv(): void {
  for (const linha of readFileSync(new URL("../.env.local", import.meta.url), "utf-8").split("\n")) {
    const m = linha.match(/^([A-Z_0-9]+)=(.*)$/);
    if (m) process.env[m[1]] = m[2].trim();
  }
}

async function main() {
  const caminhoTexto = process.argv[2];
  if (!caminhoTexto) {
    console.error("Uso: node scripts/atualizar-orcamento.ts <caminho-do-texto-extraido.txt>");
    process.exit(1);
  }

  carregarEnv();
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const texto = readFileSync(caminhoTexto, "utf-8");
  const { fichas, avisos } = parseFichaOrcamentaria(texto);
  console.log(`${fichas.length} ficha(s) extraída(s) do relatório.`);
  for (const aviso of avisos) console.warn(`  aviso: ${aviso}`);

  const { data: dotacoes, error } = await supabase
    .from("dotacoes_orcamentarias")
    .select("id, projeto_atividade_codigo, elemento_codigo, fonte_codigo")
    .eq("ativo", true);
  if (error) throw error;

  const hoje = new Date().toISOString().slice(0, 10);
  let atualizadas = 0;

  for (const ficha of fichas) {
    const candidatas = (dotacoes ?? []).filter(
      (d) =>
        d.projeto_atividade_codigo === ficha.projetoAtividadeCodigo &&
        d.elemento_codigo === ficha.elementoCodigo &&
        d.fonte_codigo === ficha.fonteCodigo,
    );

    if (candidatas.length !== 1) {
      console.warn(
        `  aviso: ${candidatas.length === 0 ? "nenhuma" : candidatas.length} dotação(ões) cadastrada(s) pra ` +
          `projeto/atividade ${ficha.projetoAtividadeCodigo} + elemento ${ficha.elementoCodigo} + fonte ${ficha.fonteCodigo} ` +
          `(${ficha.elementoNome}) — ignorada.`,
      );
      continue;
    }

    const { error: erroUpdate } = await supabase
      .from("dotacoes_orcamentarias")
      .update({
        dotacao_inicial_referencia: ficha.dotacaoInicial,
        suplementado_referencia: ficha.suplementado,
        empenhado_referencia: ficha.empenhado,
        saldo_referencia: ficha.saldo,
        saldo_referencia_em: hoje,
      })
      .eq("id", candidatas[0].id);
    if (erroUpdate) throw erroUpdate;
    atualizadas++;
  }

  console.log(`${atualizadas} dotação(ões) atualizada(s) com sucesso.`);
}

main();
