import { Celula, headerCell, PaginaA4, TabelaGrid } from "../celula";
import { formatarData, formatarMoeda } from "@/lib/pdf/formato";
import { FOTOS_POR_PAGINA } from "@/lib/pdf/paginacao";

const PARECER_LABEL: Record<string, string> = {
  aprovacao_sem_ressalvas: "APROVAÇÃO sem ressalvas",
  aprovacao_com_ressalvas: "APROVAÇÃO com ressalvas",
  reprovacao: "REPROVAÇÃO",
};

type Prestacao = {
  numero_solicitacao: string | null;
  fundamento_legal: string;
  data_solicitacao: string | null;
  data_partida: string | null;
  data_chegada: string | null;
  relatorio_resultado: string | null;
  debito_diarias_previstas: number;
  debito_diarias_nao_previstas: number;
  debito_transporte_aereo: number;
  debito_transporte_urbano: number;
  credito_recebidas_antecipadamente: number;
  credito_reembolsar: number;
  credito_transporte_urbano: number;
  credito_devolver: number;
  total_debito: number;
  total_credito: number;
  data_autenticacao_beneficiario: string | null;
  data_aprovacao_ordenador: string | null;
  parecer: string | null;
  parecer_observacao: string | null;
  parecer_data: string | null;
  controle_interno_nome: string;
  controle_interno_cargo: string;
  tesoureiro_nome: string | null;
};

type Pagamento = { id: string; numero_processo: string | null; valor: number };
type Pessoa = { nome: string } | null;
type Foto = { url: string; nome: string };
type Documento = { nome: string };

export function AnexoIIConteudo({
  prestacao,
  pagamentos,
  pessoa,
  fotos = [],
  documentos = [],
  ultimoDocumento = true,
}: {
  prestacao: Prestacao;
  pagamentos: Pagamento[];
  pessoa: Pessoa;
  fotos?: Foto[];
  documentos?: Documento[];
  // false quando há mais páginas depois (ex.: requerimento de reembolso
  // vinculado) — força a quebra de página após a última página de fotos.
  ultimoDocumento?: boolean;
}) {
  const paginasDeFotos: Foto[][] =
    fotos.length > 0
      ? Array.from({ length: Math.ceil(fotos.length / FOTOS_POR_PAGINA) }, (_, i) =>
          fotos.slice(i * FOTOS_POR_PAGINA, (i + 1) * FOTOS_POR_PAGINA),
        )
      : [[]];

  return (
    <>
      <PaginaA4>
        <div className="mx-[15mm] mt-[32mm] mb-[26mm] flex flex-1 flex-col">
          <p className="text-center text-[9pt] font-semibold">
            ANEXO II da Resolução nº 040 de 04 de abril de 2023
          </p>

          <TabelaGrid className="mt-4">
            <Celula span={12} className={`${headerCell} text-[10pt]`}>
              PRESTAÇÃO DE CONTAS DE DIÁRIA DE VIAGEM
            </Celula>

            <Celula span={8} className={headerCell}>Nome do solicitante</Celula>
            <Celula span={4} className={headerCell}>Nº solicitação</Celula>

            <Celula span={8}>{pessoa?.nome ?? "—"}</Celula>
            <Celula span={4} className="text-center">
              {prestacao.numero_solicitacao ?? "—"}
            </Celula>

            <Celula span={3} className={headerCell}>Fundamento Legal</Celula>
            <Celula span={3} className={headerCell}>Data da solicitação</Celula>
            <Celula span={3} className={headerCell}>Data de partida</Celula>
            <Celula span={3} className={headerCell}>Data de chegada</Celula>

            <Celula span={3} className="text-center">
              {prestacao.fundamento_legal}
            </Celula>
            <Celula span={3} className="text-center">
              {formatarData(prestacao.data_solicitacao)}
            </Celula>
            <Celula span={3} className="text-center">
              {formatarData(prestacao.data_partida)}
            </Celula>
            <Celula span={3} className="text-center">
              {formatarData(prestacao.data_chegada)}
            </Celula>

            <Celula span={12} className={`${headerCell} leading-tight`}>
              RELATÓRIO DO RESULTADO DA VIAGEM
              <br />
              COM ÊNFASE NO INTERESSE PÚBLICO DEFENDIDO
            </Celula>
            <Celula span={12} className="min-h-[140mm] align-top whitespace-pre-wrap !text-justify">
              {prestacao.relatorio_resultado}
            </Celula>
          </TabelaGrid>
        </div>
      </PaginaA4>

      <PaginaA4>
        <div className="mx-[15mm] mt-[32mm] mb-[26mm] flex flex-1 flex-col">
          <TabelaGrid>
            <Celula span={12} className={`${headerCell} text-[10pt]`}>
              DEMONSTRATIVO FINANCEIRO
            </Celula>

            <Celula span={6} className={headerCell}>Débito - Valores realizados</Celula>
            <Celula span={6} className={`${headerCell} leading-tight`}>
              Crédito - Valores recebidos
              <br />e a receber ou restituir
            </Celula>

            <Celula span={4}>Diárias previstas e realizadas</Celula>
            <Celula span={2} className="text-center">
              {formatarMoeda(prestacao.debito_diarias_previstas)}
            </Celula>
            <Celula span={4}>Diárias recebidas antecipadamente</Celula>
            <Celula span={2} className="text-center">
              {formatarMoeda(prestacao.credito_recebidas_antecipadamente)}
            </Celula>

            <Celula span={4}>Diárias não previstas, mas realizadas</Celula>
            <Celula span={2} className="text-center">
              {formatarMoeda(prestacao.debito_diarias_nao_previstas)}
            </Celula>
            <Celula span={4}>Reembolsar diárias realizadas e não recebidas</Celula>
            <Celula span={2} className="text-center">
              {formatarMoeda(prestacao.credito_reembolsar)}
            </Celula>

            <Celula span={4}>Despesas com transporte aéreo</Celula>
            <Celula span={2} className="text-center">
              {formatarMoeda(prestacao.debito_transporte_aereo)}
            </Celula>
            <Celula span={4}>
              Despesas com transporte urbano, pedágio, combustível e estacionamento
            </Celula>
            <Celula span={2} className="text-center">
              {formatarMoeda(prestacao.credito_transporte_urbano)}
            </Celula>

            <Celula span={4}>
              Despesas com transporte urbano, pedágio, combustível e estacionamento
            </Celula>
            <Celula span={2} className="text-center">
              {formatarMoeda(prestacao.debito_transporte_urbano)}
            </Celula>
            <Celula span={4}>Devolver diárias recebidas e não realizadas (-)</Celula>
            <Celula span={2} className="text-center">
              {formatarMoeda(prestacao.credito_devolver)}
            </Celula>

            <Celula span={4} className="font-semibold">TOTAL DO DÉBITO</Celula>
            <Celula span={2} className="text-center font-semibold">
              {formatarMoeda(prestacao.total_debito)}
            </Celula>
            <Celula span={4} className="font-semibold">TOTAL DO CRÉDITO</Celula>
            <Celula span={2} className="text-center font-semibold">
              {formatarMoeda(prestacao.total_credito)}
            </Celula>

            <Celula span={12} className={headerCell}>
              Autenticação do beneficiário dos recursos da viagem
            </Celula>
            <Celula span={12} className="min-h-[22mm] text-center">
              <p>Declaro, sob as penas da lei, que as informações declaradas são verídicas.</p>
              <p className="mt-2">{formatarData(prestacao.data_autenticacao_beneficiario)}</p>
              <div className="mx-auto mt-[10mm] w-2/3 border-t border-black pt-1">
                Assinatura do beneficiário
              </div>
            </Celula>

            <Celula span={6} className={headerCell}>Aprovação do ordenador da despesa</Celula>
            <Celula span={6} className={headerCell}>Baixa do pagamento</Celula>

            <Celula span={6} className="min-h-[28mm] text-center">
              <p>Aprovo a prestação de contas apresentada.</p>
              <p className="mt-2">{formatarData(prestacao.data_aprovacao_ordenador)}</p>
              <div className="mx-auto mt-[8mm] w-2/3 border-t border-black pt-1">
                Assinatura do ordenador da despesa
              </div>
            </Celula>
            <Celula span={6} className="min-h-[28mm]">
              <p>Atesto o pagamento nos termos abaixo:</p>
              <div className="mt-2 space-y-1">
                {pagamentos.map((p) => (
                  <p key={p.id}>
                    Nº {p.numero_processo} — {formatarMoeda(p.valor)}
                  </p>
                ))}
              </div>
              <div className="mx-auto mt-[6mm] w-2/3 border-t border-black pt-1 text-center">
                Assinatura do Tesoureiro
              </div>
            </Celula>

            <Celula span={12} className={headerCell}>
              Parecer conclusivo do Controle Interno
            </Celula>
            <Celula span={12} className="min-h-[38mm]">
              <p>
                Atesto que à luz da legislação vigente e das decisões do Tribunal de Contas de
                Minas Gerais, acerca da prestação de contas da viagem acima, emito opinião pela:
              </p>
              <div className="mt-2 space-y-1 text-center">
                {Object.entries(PARECER_LABEL).map(([valor, label]) => (
                  <p key={valor}>
                    {prestacao.parecer === valor ? "☒" : "☐"} {label}
                  </p>
                ))}
              </div>
              <p className="mt-2">Observação: {prestacao.parecer_observacao ?? ""}</p>
              <p className="mt-4 text-center">{formatarData(prestacao.parecer_data)}</p>
              <div className="mx-auto mt-[8mm] w-2/3 border-t border-black pt-1 text-center">
                Assinatura do Controle Interno
              </div>
              <p className="mt-1 text-center text-[7pt]">
                P.P. {prestacao.controle_interno_nome} — {prestacao.controle_interno_cargo}
              </p>
            </Celula>
          </TabelaGrid>
        </div>
      </PaginaA4>

      {paginasDeFotos.map((grupo, indice) => {
        const ultimaPagina = indice === paginasDeFotos.length - 1;
        return (
          <PaginaA4 key={indice} quebrarPagina={!ultimaPagina || !ultimoDocumento}>
            <div className="mx-[15mm] mt-[32mm] mb-[26mm] flex flex-1 flex-col">
              <TabelaGrid>
                <Celula span={12} className={`${headerCell} text-[10pt]`}>
                  FOTOS
                </Celula>
                <Celula span={12} className="min-h-[220mm]">
                  {grupo.length > 0 ? (
                    <div className="flex h-full flex-col gap-3 p-1">
                      {grupo.map((foto, i) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={i}
                          src={foto.url}
                          alt={foto.nome}
                          className="h-[105mm] w-full rounded border border-slate-300 bg-slate-50 object-contain"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="p-2 text-center text-slate-400">Nenhuma foto anexada.</p>
                  )}
                  {ultimaPagina && documentos.length > 0 && (
                    <div className="mt-4 p-1 text-[8pt]">
                      <p className="font-semibold">Documentos anexados:</p>
                      <ul className="list-disc pl-4">
                        {documentos.map((doc, i) => (
                          <li key={i}>{doc.nome}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Celula>
              </TabelaGrid>
            </div>
          </PaginaA4>
        );
      })}
    </>
  );
}
