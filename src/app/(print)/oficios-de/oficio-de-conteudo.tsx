import { PaginaA4 } from "../celula";
import { dataPorExtenso } from "@/lib/pdf/formato";
import {
  CIDADE,
  DIRETOR_EXECUTIVO_CARGO,
  DIRETOR_EXECUTIVO_NOME,
  NOME_CAMARA,
  numeroOficioDEFormatado,
} from "@/lib/oficios-de/documento";
import { sanitizarHtmlDocumento } from "@/lib/sanitizar-html";

type OficioDE = {
  numero: string;
  ano: number;
  data_oficio: string;
  destinatario_tratamento: string;
  destinatario_nome: string;
  destinatario_cargo: string | null;
  destinatario_cidade_uf: string | null;
  saudacao: string;
  assunto: string;
  corpo_texto: string;
};

export function OficioDEConteudo({ oficio }: { oficio: OficioDE }) {
  // Sanitiza de novo aqui (já sanitizado ao salvar) — roda dentro da própria
  // página que o Puppeteer abre pra gerar o PDF, vale a camada extra de
  // segurança direto no ponto de renderização (mesma convenção da
  // Secretaria — ver oficio-conteudo.tsx).
  const corpoHtml = sanitizarHtmlDocumento(oficio.corpo_texto);

  return (
    <PaginaA4 backgroundImage="/timbrado/oficio-diretor-executivo.png">
      {/* Margens medidas por comparação direta com um ofício real do Diretor
          Executivo (nº 014/2026/DE/CMN): texto começa a ~61mm do topo,
          ~30mm de cada lado, banner do rodapé começa a ~278mm — mb com
          folga pra nunca encostar nele. */}
      <div className="ml-[30mm] mr-[30mm] mt-[54mm] mb-[24mm] flex flex-1 flex-col text-[12pt] leading-relaxed">
        <p>{numeroOficioDEFormatado({ numero: oficio.numero, ano: oficio.ano })}</p>
        <p className="mt-4 text-right">
          {CIDADE}, {dataPorExtenso(oficio.data_oficio)}.
        </p>

        <div className="mt-6 leading-none">
          {/* Tratamento é texto livre e pode ficar vazio — alguns ofícios
              reais são endereçados a um setor do Executivo (ex.: um
              Departamento), sem tratamento de pessoa nenhum. */}
          {oficio.destinatario_tratamento.trim() && <p>Ao {oficio.destinatario_tratamento}</p>}
          <p>{oficio.destinatario_nome}</p>
          {oficio.destinatario_cargo && <p>{oficio.destinatario_cargo}</p>}
          {oficio.destinatario_cidade_uf && <p>{oficio.destinatario_cidade_uf}</p>}
        </div>

        <p className="mt-4 font-bold">Assunto: {oficio.assunto}</p>

        <p className="mt-6">{oficio.saudacao}</p>

        <div
          className="mt-3 space-y-3 text-justify [&>p]:indent-[1.25cm] [&_ol]:list-decimal [&_ol]:pl-[1.25cm] [&_ul]:list-disc [&_ul]:pl-[1.25cm]"
          dangerouslySetInnerHTML={{ __html: corpoHtml }}
        />

        <p className="mt-6">Atenciosamente.</p>

        <div className="mx-auto mt-[16mm] w-[100mm] text-center leading-none">
          <p className="font-bold">{DIRETOR_EXECUTIVO_NOME}</p>
          <p>{DIRETOR_EXECUTIVO_CARGO}</p>
          <p>{NOME_CAMARA} - MG</p>
        </div>
      </div>
    </PaginaA4>
  );
}
