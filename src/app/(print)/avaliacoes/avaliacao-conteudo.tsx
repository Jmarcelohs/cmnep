import { Celula, headerCell, PaginaA4, TabelaGrid } from "../celula";
import { formatarData } from "@/lib/pdf/formato";
import { calcularResumo } from "@/lib/avaliacoes/calculo";
import type { AvaliacaoTemplate, CriterioTemplate } from "@/lib/avaliacoes/templates";
import type { AvaliadorLancado, ItemAvaliacaoLancado, PeriodoAvaliacao } from "@/lib/supabase/database.types";

type Avaliacao = {
  pessoa: { nome: string; matricula: string | null };
  ano: number;
  periodo: PeriodoAvaliacao;
  data_avaliacao: string;
  avaliadores: AvaliadorLancado[];
  itens: ItemAvaliacaoLancado[];
  pontos_melhorar: string | null;
  pontos_positivos: string | null;
};

const PERIODO_LABEL: Record<PeriodoAvaliacao, string> = {
  trimestre_1: "1º Trimestre",
  trimestre_2: "2º Trimestre",
  trimestre_3: "3º Trimestre",
  anual: "Anual (Final)",
};

// Colunas de conceito na tabela de detalhamento são estreitas (span 1 de
// 12), então usam sigla de 2 letras em vez do rótulo completo — com
// legenda no topo da página. Puramente ASCII, sem acento, pra não
// depender de subset de fonte específico no Acrobat.
const SIGLA_CONCEITO: Record<string, string> = {
  otimo: "OT",
  muito_bom: "MB",
  bom: "BO",
  regular: "RE",
  insuficiente: "IN",
};

function Cabecalho({ avaliacao, template }: { avaliacao: Avaliacao; template: AvaliacaoTemplate }) {
  return (
    <>
      <p className="text-center text-[13pt] font-bold">AVALIAÇÃO DE DESEMPENHO</p>
      <p className="mt-1 text-center text-[10pt] font-bold uppercase">{template.nome}</p>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-[10pt]">
        <p>
          <span className="font-bold">Servidor(a):</span> {avaliacao.pessoa.nome}
        </p>
        <p>
          <span className="font-bold">Matrícula:</span> {avaliacao.pessoa.matricula ?? "—"}
        </p>
        <p>
          <span className="font-bold">Período:</span> {PERIODO_LABEL[avaliacao.periodo]}/{avaliacao.ano}
        </p>
        <p>
          <span className="font-bold">Data da avaliação:</span> {formatarData(avaliacao.data_avaliacao)}
        </p>
        <p className="col-span-2">
          <span className="font-bold">Responsáveis pela avaliação:</span>{" "}
          {avaliacao.avaliadores.map((a) => a.nome).join(", ") || "—"}
        </p>
      </div>
    </>
  );
}

function TabelaResumo({ template, resumo }: { template: AvaliacaoTemplate; resumo: ReturnType<typeof calcularResumo> }) {
  return (
    <div className="mt-4">
      <p className="text-[10pt] font-bold">Quantidade de Conceitos Obtidos</p>
      <TabelaGrid className="mt-1 text-[8pt]">
        <Celula span={2} className={headerCell}>
          Critério
        </Celula>
        {template.conceitos.map((c) => (
          <Celula key={c.key} span={2} className={headerCell}>
            {c.label}
          </Celula>
        ))}

        {template.criterios.map((criterio) => (
          <div key={criterio.key} className="col-span-12 grid grid-cols-12">
            <Celula span={2} className="text-left">
              {criterio.key} - {criterio.nome}
            </Celula>
            {template.conceitos.map((c) => (
              <Celula key={c.key} span={2}>
                {resumo.porCriterio[criterio.key]?.[c.key] || ""}
              </Celula>
            ))}
          </div>
        ))}

        <Celula span={2} className="font-bold">
          Total dos Conceitos
        </Celula>
        {template.conceitos.map((c) => (
          <Celula key={c.key} span={2} className="font-bold">
            {resumo.totalPorConceito[c.key]}
          </Celula>
        ))}
      </TabelaGrid>
    </div>
  );
}

function TabelaPontos({ template, resumo }: { template: AvaliacaoTemplate; resumo: ReturnType<typeof calcularResumo> }) {
  return (
    <div className="mt-4">
      <p className="text-[10pt] font-bold">Cálculo dos Pontos</p>
      <TabelaGrid className="mt-1 text-[8pt]">
        <Celula span={4} className={headerCell}>
          Conceito
        </Celula>
        <Celula span={2} className={headerCell}>
          Peso
        </Celula>
        <Celula span={3} className={headerCell}>
          Qtde.
        </Celula>
        <Celula span={3} className={headerCell}>
          Pontos
        </Celula>

        {template.conceitos.map((c) => (
          <div key={c.key} className="col-span-12 grid grid-cols-12">
            <Celula span={4} className="text-left">
              {c.label}
            </Celula>
            <Celula span={2}>x{c.peso}</Celula>
            <Celula span={3}>{resumo.totalPorConceito[c.key]}</Celula>
            <Celula span={3}>{resumo.pontosPorConceito[c.key]}</Celula>
          </div>
        ))}
      </TabelaGrid>
      <p className="mt-2 text-right text-[12pt] font-bold">Nota Final: {resumo.notaFinal.toFixed(2)} / 100</p>
    </div>
  );
}

function TabelaDetalhamento({
  criterios,
  template,
  itens,
}: {
  criterios: CriterioTemplate[];
  template: AvaliacaoTemplate;
  itens: ItemAvaliacaoLancado[];
}) {
  const conceitoDoItem = new Map(itens.map((i) => [`${i.criterio}-${i.numero}`, i.conceito]));

  return (
    <div className="mt-3">
      {criterios.map((criterio) => (
        <div key={criterio.key} className="mb-4">
          <p className="text-[9pt] font-bold">
            {criterio.key} — {criterio.nome}
          </p>
          <p className="text-[7pt] text-slate-600">{criterio.definicao}</p>
          {criterio.escala && <p className="text-[7pt] italic text-slate-500">{criterio.escala}</p>}

          <TabelaGrid className="mt-1 text-[7pt]">
            <Celula span={7} className={`${headerCell} text-left`}>
              Item
            </Celula>
            {template.conceitos.map((c) => (
              <Celula key={c.key} span={1} className={headerCell}>
                {SIGLA_CONCEITO[c.key]}
              </Celula>
            ))}

            {criterio.itens.map((item) => {
              const conceito = conceitoDoItem.get(`${criterio.key}-${item.numero}`);
              return (
                <div key={item.numero} className="col-span-12 grid grid-cols-12">
                  <Celula span={7} className="text-left">
                    {item.numero}. {item.texto}
                  </Celula>
                  {template.conceitos.map((c) => (
                    <Celula key={c.key} span={1}>
                      {conceito === c.key ? "X" : ""}
                    </Celula>
                  ))}
                </div>
              );
            })}
          </TabelaGrid>
        </div>
      ))}
    </div>
  );
}

function BlocoAssinaturas({ avaliadores }: { avaliadores: AvaliadorLancado[] }) {
  return (
    <div className="mt-6">
      <p className="text-[9pt] font-bold">Assinaturas dos Avaliadores</p>
      <TabelaGrid className="mt-1 text-[8pt]">
        {avaliadores.map((avaliador, i) => (
          <Celula key={i} span={3} className="min-h-[24mm] text-center">
            <div className="mt-[14mm] border-t border-black pt-1">
              <p className="font-bold">{avaliador.nome}</p>
              {avaliador.matricula && <p>Matrícula: {avaliador.matricula}</p>}
            </div>
          </Celula>
        ))}
        {avaliadores.length === 0 && (
          <Celula span={12} className="min-h-[24mm] text-slate-400">
            Nenhum avaliador informado
          </Celula>
        )}
      </TabelaGrid>
    </div>
  );
}

export function AvaliacaoConteudo({
  avaliacao,
  template,
  quebrarPagina = true,
}: {
  avaliacao: Avaliacao;
  template: AvaliacaoTemplate;
  quebrarPagina?: boolean;
}) {
  const resumo = calcularResumo(avaliacao.itens, template);
  const criterios = template.criterios;
  const metade = Math.ceil(criterios.length / 2);
  const primeiraMetade = criterios.slice(0, metade);
  const segundaMetade = criterios.slice(metade);

  return (
    <>
      <PaginaA4 quebrarPagina>
        <div className="mx-[15mm] mt-[32mm] mb-[26mm] flex flex-1 flex-col">
          <Cabecalho avaliacao={avaliacao} template={template} />
          <TabelaResumo template={template} resumo={resumo} />
          <TabelaPontos template={template} resumo={resumo} />
        </div>
      </PaginaA4>

      <PaginaA4 quebrarPagina>
        <div className="mx-[15mm] mt-[32mm] mb-[26mm] flex flex-1 flex-col">
          <p className="text-[9pt] font-bold">Detalhamento dos Critérios</p>
          <p className="text-[7pt] text-slate-500">
            Legenda: OT = Ótimo | MB = Muito Bom | BO = Bom | RE = Regular | IN = Insuficiente
          </p>
          <TabelaDetalhamento criterios={primeiraMetade} template={template} itens={avaliacao.itens} />
        </div>
      </PaginaA4>

      <PaginaA4 quebrarPagina={quebrarPagina}>
        <div className="mx-[15mm] mt-[32mm] mb-[26mm] flex flex-1 flex-col">
          <p className="text-[9pt] font-bold">Detalhamento dos Critérios (continuação)</p>
          <TabelaDetalhamento criterios={segundaMetade} template={template} itens={avaliacao.itens} />

          {(avaliacao.pontos_positivos || avaliacao.pontos_melhorar) && (
            <div className="mt-3 space-y-3 text-[8pt]">
              {avaliacao.pontos_positivos && (
                <div>
                  <p className="font-bold">Pontos Positivos</p>
                  <p className="text-justify">{avaliacao.pontos_positivos}</p>
                </div>
              )}
              {avaliacao.pontos_melhorar && (
                <div>
                  <p className="font-bold">Pontos a Serem Melhorados</p>
                  <p className="text-justify">{avaliacao.pontos_melhorar}</p>
                </div>
              )}
            </div>
          )}

          <BlocoAssinaturas avaliadores={avaliacao.avaliadores} />
        </div>
      </PaginaA4>
    </>
  );
}
