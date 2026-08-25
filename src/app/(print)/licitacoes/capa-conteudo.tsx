import { Celula, PaginaA4, TabelaGrid } from "../celula";
import { sanitizarHtmlDocumento } from "@/lib/sanitizar-html";
import { dataPorExtensoFormal, formatarData } from "@/lib/pdf/formato";
import { montarDotacaoCompleta } from "@/lib/licitacoes/documento-capa";
import { MODALIDADES_PROCESSO, rotuloNumeroModalidade, rotuloNumeroProcesso } from "@/lib/licitacoes/tipos";
import type { ModalidadeProcesso, PessoaResumo } from "@/lib/licitacoes/tipos";
import type { DotacaoOrcamentaria } from "@/lib/suplementacoes/documento";

export type ProcessoParaCapa = {
  numeroProcesso: number;
  ano: number;
  modalidade: ModalidadeProcesso;
  numeroModalidade: number;
  dataAbertura: string;
  objeto: string;
  dotacaoSubelemento: string;
  vinculoPca: string;
};

const FONTE = "Arial, Helvetica, sans-serif";

export function CapaConteudo({
  processo,
  ficha,
  organizador,
  corpoHtml,
}: {
  processo: ProcessoParaCapa;
  ficha: DotacaoOrcamentaria | null;
  organizador: PessoaResumo | null;
  corpoHtml: string;
}) {
  const paragrafoAbertura = sanitizarHtmlDocumento(corpoHtml);
  const rotuloModalidadeDoc =
    MODALIDADES_PROCESSO.find((m) => m.valor === processo.modalidade)?.rotuloDocumento ?? "";
  const dotacaoCompleta = montarDotacaoCompleta(ficha, processo.dotacaoSubelemento);

  return (
    <PaginaA4 backgroundImage="/timbrado/licitacoes.jpg">
      {/* Margens de primeira aproximação — ainda não medidas contra o
          documento real impresso (o timbrado tem logo só no topo e faixa
          de rodapé decorativa na base, sem margens laterais fixas de
          texto). Ajustar por comparação visual depois de imprimir. */}
      <div className="ml-[20mm] mr-[20mm] mt-[42mm] mb-[35mm] flex flex-1 flex-col text-[12pt]" style={{ fontFamily: FONTE }}>
        <p className="text-center text-[18pt] font-bold underline">CAPA DO PROCESSO</p>

        <div className="mx-auto mt-6 border border-black px-4 py-1">
          <p className="text-center text-[10pt] font-bold">
            {dataPorExtensoFormal(processo.dataAbertura).toUpperCase()}
          </p>
        </div>

        <div className="mt-4 text-justify" dangerouslySetInnerHTML={{ __html: paragrafoAbertura }} />

        {organizador && (
          <div className="mt-16 text-center">
            <p className="font-bold uppercase">{organizador.nome}</p>
            <p>{organizador.genero === "F" ? "Estagiária" : "Estagiário"}</p>
          </div>
        )}

        <TabelaGrid className="mt-10">
          <Celula span={8} className="text-left font-bold">
            PROCEDIMENTO ADMINISTRATIVO Nº {rotuloNumeroProcesso(processo)}
          </Celula>
          <Celula span={4} className="text-left font-bold">
            DATA: {formatarData(processo.dataAbertura)}
          </Celula>

          <Celula span={12} className="text-left font-bold">
            {rotuloModalidadeDoc} Nº {rotuloNumeroModalidade(processo)}
          </Celula>

          <Celula span={12} className="text-center font-bold">
            OBJETO:
          </Celula>
          <Celula span={12} className="py-6 text-left">
            {processo.objeto}
          </Celula>

          <Celula span={12} className="text-center font-bold">
            DOTAÇÃO ORÇAMENTÁRIA:
          </Celula>
          <Celula span={12} className="py-6 text-left">
            {dotacaoCompleta}
          </Celula>

          <Celula span={12} className="text-center font-bold">
            VÍNCULO NO PCA:
          </Celula>
          <Celula span={12} className="py-6 text-left">
            {processo.vinculoPca || "—"}
          </Celula>
        </TabelaGrid>
      </div>
    </PaginaA4>
  );
}
