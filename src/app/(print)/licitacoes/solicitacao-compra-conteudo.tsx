import { PaginaA4 } from "../celula";
import { sanitizarHtmlDocumento } from "@/lib/sanitizar-html";
import { dataPorExtenso, formatarMoeda } from "@/lib/pdf/formato";
import { MESA_DIRETORA } from "@/lib/suplementacoes/documento";
import { TrConteudo } from "./tr-conteudo";
import type { ItemProcesso, PessoaResumo } from "@/lib/licitacoes/tipos";

const FONTE = "Arial, Helvetica, sans-serif";
// Bloco de conteúdo NÃO usa flex (mesmo dentro de um PaginaA4 flex-col) —
// quando uma tabela precisa quebrar entre páginas (Chromium não decide
// quebra de linha de tabela de forma confiável dentro de um container
// flex), o resultado é uma linha "fantasma" sobreposta ao timbrado da
// página seguinte (bug visto ao vivo com a tabela DEMANDA). Bloco normal
// resolve — testado ao vivo.
const CONTEUDO_CLASSE = "ml-[20mm] mr-[20mm] mt-[42mm] mb-[35mm] text-[11pt] leading-[1.4]";

function TabelaDemanda({ itens, comValores }: { itens: ItemProcesso[]; comValores: boolean }) {
  return (
    <>
      <p className="mt-4 text-center font-bold">DEMANDA – BEM/SERVIÇO/OBRAS E/OU INSTALAÇÕES</p>
      <table className="mt-1 w-full border-collapse border border-black text-[9pt]">
        <thead style={{ display: "table-header-group" }}>
          <tr className="[break-inside:avoid]">
            <th className="border border-black px-1 py-1">ITEM</th>
            <th className="border border-black px-1 py-1">OBJETO</th>
            <th className="border border-black px-1 py-1">UNID.</th>
            <th className="border border-black px-1 py-1">QUANT.</th>
            <th className="border border-black px-1 py-1">V. UNITÁRIO</th>
            <th className="border border-black px-1 py-1">V. GLOBAL</th>
          </tr>
        </thead>
        <tbody>
          {itens.map((i) => (
            <tr key={i.id} className="[break-inside:avoid]">
              <td className="border border-black px-1 py-1 text-center">{String(i.numeroItem).padStart(3, "0")}</td>
              <td className="border border-black px-1 py-1 text-justify">{i.objeto}</td>
              <td className="border border-black px-1 py-1 text-center">{i.unidade}</td>
              <td className="border border-black px-1 py-1 text-center">{i.quantidade}</td>
              <td className="border border-black px-1 py-1 text-center">
                {comValores && i.valorUnitario != null ? formatarMoeda(i.valorUnitario) : ""}
              </td>
              <td className="border border-black px-1 py-1 text-center">
                {comValores && i.valorGlobal != null ? formatarMoeda(i.valorGlobal) : ""}
              </td>
            </tr>
          ))}
          {itens.length === 0 && (
            <tr>
              <td colSpan={6} className="border border-black px-1 py-2 text-center text-slate-400">
                Nenhum item cadastrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}

export function SolicitacaoConteudo({
  destinatario,
  corpoHtml,
  itens,
  dataAbertura,
}: {
  destinatario: PessoaResumo | null;
  corpoHtml: string;
  itens: ItemProcesso[];
  dataAbertura: string;
}) {
  const html = sanitizarHtmlDocumento(corpoHtml);
  const tratamento = destinatario?.genero === "F" ? "Prezada" : "Prezado";
  return (
    <PaginaA4 backgroundImage="/timbrado/licitacoes.jpg">
      <div className={CONTEUDO_CLASSE} style={{ fontFamily: FONTE }}>
        <p className="text-center text-[18pt] font-bold underline">SOLICITAÇÃO</p>
        <p className="mt-6">
          <strong>Assunto:</strong> Solicita Pesquisa de Preços
        </p>
        <p className="mt-4">
          {tratamento} {destinatario?.nome ?? "[destinatário não definido]"},
        </p>
        <div
          className="mt-4 text-justify [&_p]:mb-2"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <TabelaDemanda itens={itens} comValores={false} />
        <p className="mt-6 text-justify">
          Agradeço antecipadamente sua atenção e colaboração. Em caso de dúvidas ou necessidade de
          informações adicionais, a disposição para esclarecimentos.
        </p>
        <p className="mt-8 text-right">Nepomuceno, Minas Gerais, {dataPorExtenso(dataAbertura)}.</p>
        <div className="mt-10 text-center">
          <p className="font-bold uppercase">{MESA_DIRETORA.presidente.nome}</p>
          <p>{MESA_DIRETORA.presidente.cargo}</p>
          <p>{MESA_DIRETORA.bienio}</p>
        </div>
      </div>
    </PaginaA4>
  );
}

export function PropostaComercialConteudo({ objeto, itens }: { objeto: string; itens: ItemProcesso[] }) {
  return (
    <>
      <PaginaA4 backgroundImage="/timbrado/licitacoes.jpg">
        <div className={CONTEUDO_CLASSE} style={{ fontFamily: FONTE }}>
          <p className="text-center text-[18pt] font-bold underline">PROPOSTA COMERCIAL</p>
          <p className="mt-6">_______________________, _______________________, ____________.</p>
          <p className="mt-4">À Câmara Municipal de Nepomuceno</p>
          <p className="mt-2">
            <strong>Assunto:</strong> Proposta Comercial
          </p>
          <p className="mt-2 text-justify">
            Apresentamos, a seguir, proposta comercial para a {objeto.charAt(0).toLowerCase() + objeto.slice(1)}
          </p>

          <p className="mt-4 text-center font-bold">DADOS DA EMPRESA</p>
          <table className="mt-1 w-full border-collapse border border-black text-[9pt]">
            <tbody>
              {[
                "RAZÃO SOCIAL",
                "CNPJ",
                "RESPONSÁVEL LEGAL",
                "CPF DO RESPONSÁVEL LEGAL",
                "ENDEREÇO",
                "CIDADE",
                "ESTADO",
                "CEP",
                "E-MAIL",
                "TELEFONE",
              ].map((rotulo) => (
                <tr key={rotulo}>
                  <td className="border border-black px-2 py-1 text-right font-bold">{rotulo}:</td>
                  <td className="border border-black px-2 py-1">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

          <p className="mt-4 text-center font-bold">DADOS BANCÁRIOS</p>
          <table className="mt-1 w-full border-collapse border border-black text-[9pt]">
            <tbody>
              <tr>
                <td className="border border-black px-2 py-1 text-right font-bold">BANCO:</td>
                <td className="border border-black px-2 py-1">&nbsp;</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-right font-bold">AGÊNCIA:</td>
                <td className="border border-black px-2 py-1">&nbsp;</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-right font-bold">N° DA CONTA (COM DÍGITO):</td>
                <td className="border border-black px-2 py-1">&nbsp;</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-right font-bold">CONTA:</td>
                <td className="border border-black px-2 py-1">( ) CORRENTE&nbsp;&nbsp;&nbsp;( ) POUPANÇA</td>
              </tr>
              <tr>
                <td className="border border-black px-2 py-1 text-right font-bold">TIPO DE CONTA:</td>
                <td className="border border-black px-2 py-1">( ) PESSOA FÍSICA&nbsp;&nbsp;( ) PESSOA JURÍDICA</td>
              </tr>
              {["CHAVE PIX", "NOME DO TITULAR", "CPF/CNPJ DO TITULAR"].map((rotulo) => (
                <tr key={rotulo}>
                  <td className="border border-black px-2 py-1 text-right font-bold">{rotulo}:</td>
                  <td className="border border-black px-2 py-1">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>

        </div>
      </PaginaA4>

      {/* Página própria pra tabela de itens — dividida da página anterior
          de propósito (não por overflow natural): uma PaginaA4 tem altura
          fixa, então conteúdo que a estoura sobrepõe o timbrado da próxima
          em vez de empurrá-la pra baixo (bug visto ao vivo quando a tabela
          dividia espaço com os dados da empresa/bancários). */}
      <PaginaA4 backgroundImage="/timbrado/licitacoes.jpg">
        <div className={CONTEUDO_CLASSE} style={{ fontFamily: FONTE }}>
          <TabelaDemanda itens={itens} comValores={false} />
        </div>
      </PaginaA4>

      <PaginaA4 backgroundImage="/timbrado/licitacoes.jpg">
        <div className={CONTEUDO_CLASSE} style={{ fontFamily: FONTE }}>
          <p className="mt-4 font-bold">VALIDADE DA PROPOSTA: 60 DIAS</p>
          <div className="mt-16 bg-yellow-200 p-2 text-center font-bold">
            <p>Nome do representante legal ou procurador da empresa</p>
            <p>CPF do representante legal ou procurador da empresa</p>
            <p>Cargo do representante legal da empresa</p>
            <p>Assinatura preferencialmente digital (token/gov.br)</p>
          </div>
        </div>
      </PaginaA4>
    </>
  );
}

export function AnexoIConteudo() {
  return (
    <PaginaA4 backgroundImage="/timbrado/licitacoes.jpg">
      <div className={CONTEUDO_CLASSE} style={{ fontFamily: FONTE }}>
        <p className="text-center font-bold">ANEXO I</p>
        <p className="mt-2 text-center font-bold">
          Documentação para Instrução do Procedimento Administrativo de Dispensa de Licitação em Razão
          de Valor
        </p>

        <p className="mt-6 font-bold">1. Habilitação Jurídica:</p>
        <p className="mt-1">
          1.1 Ato Constitutivo (contrato social, estatuto social ou requerimento de empresário); com
          todas as alterações ou consolidação do Ato Constitutivo;
        </p>
        <p className="mt-1">1.2 Procuração dos respectivos representantes nas licitações (se for o caso);</p>
        <p className="mt-1">
          1.3 Documentos com foto do representante legal e/ou do procurador (se for o caso);
        </p>
        <p className="mt-1">
          1.4 Decreto de Autorização de Funcionamento (se no caso se tratar de empresas estrangeiras que
          funcionam no Brasil).
        </p>

        <p className="mt-4 font-bold">2. Habilitação Fiscal e Trabalhista:</p>
        <p className="mt-1">2.1 Prova de inscrição no Cadastro Nacional de Pessoa Jurídica (CNPJ);</p>
        <p className="mt-1">2.2 Certidão Negativa de Débitos Federais;</p>
        <p className="mt-1">2.3 Certidão Negativa de Débitos Estaduais;</p>
        <p className="mt-1">2.4 Certidão Negativa de Débitos Municipais;</p>
        <p className="mt-1">2.5 Certidão Negativa de Débitos Trabalhista (JUS);</p>
        <p className="mt-1">2.6 Certidão Negativa de Débitos do FGTS.</p>

        <p className="mt-4 font-bold">3. Declaração conjunta:</p>
        <p className="mt-1 text-justify">
          3.1 Declaração conjunta de que: a empresa atende aos requisitos de habilitação, a empresa
          responderá pela veracidade das informações apresentadas na forma da lei, a empresa não foi
          declarada inidônea por ato do Poder Público, não está impedida de transacionar com a
          Administração Pública, não foi apenada com rescisão de contrato, não incorre nas demais
          condições impeditivas previstas na Lei Federal n° 14.133/21, que cumpre com as exigências de
          reserva de cargos para pessoa com deficiência e para reabilitado da previdência social,
          previstas em lei, que a empresa tomou conhecimento a respeito de todas as informações e
          condições para o cumprimento das obrigações da respectiva contratação e que não emprega
          menor.
        </p>

        <p className="mt-4 font-bold">4. Certidão emitida pela Controladoria Geral da União:</p>
        <p className="mt-1">4.1 Certidão negativa correcional (e-PAD, CGU-PAD, CGU-PJ, CEIS, CNEP e CEPIM).</p>

        <p className="mt-4 font-bold">5. Qualificação Econômico-financeira:</p>
        <p className="mt-1">5.1 Certidão de Falência ou Concordata.</p>
      </div>
    </PaginaA4>
  );
}

export function SolicitacaoCompraConteudo({
  destinatario,
  corpoHtml,
  itens,
  objeto,
  dataAbertura,
  trCorpoHtml,
}: {
  destinatario: PessoaResumo | null;
  corpoHtml: string;
  itens: ItemProcesso[];
  objeto: string;
  dataAbertura: string;
  trCorpoHtml: string;
}) {
  return (
    <>
      <SolicitacaoConteudo
        destinatario={destinatario}
        corpoHtml={corpoHtml}
        itens={itens}
        dataAbertura={dataAbertura}
      />
      <PropostaComercialConteudo objeto={objeto} itens={itens} />
      {/* TrConteudo já traz o Anexo I ao final (mesmo checklist, uma vez só) */}
      <TrConteudo corpoHtml={trCorpoHtml} />
    </>
  );
}
