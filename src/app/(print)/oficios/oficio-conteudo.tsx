import { PaginaA4 } from "../celula";
import { dataPorExtenso } from "@/lib/pdf/formato";
import {
  aberturaOficio,
  CIDADE,
  fraseEventoConvite,
  injetarAberturaHtml,
  LEGISLATURA,
  numeroOficioFormatado,
  PRESIDENTE_CARGO,
  SIGNATARIO_OFICIO,
} from "@/lib/oficios/documento";
import { sanitizarHtmlDocumento } from "@/lib/sanitizar-html";
import type { GeneroVereador, TipoOficio, TratamentoOficio } from "@/lib/supabase/database.types";

type Oficio = {
  tipo: TipoOficio;
  numero: string;
  ano: number;
  data_oficio: string;
  destinatario_tratamento: TratamentoOficio;
  destinatario_nome: string;
  destinatario_cargo: string;
  destinatario_cidade_uf: string | null;
  saudacao: string;
  assunto: string;
  autor_nome: string | null;
  autor_genero: GeneroVereador | null;
  autor_associado_nome: string | null;
  autor_associado_genero: GeneroVereador | null;
  corpo_texto: string;
  evento_data: string | null;
  evento_hora: string | null;
  evento_local: string | null;
  paragrafo_fechamento: string;
};

export function OficioConteudo({ oficio }: { oficio: Oficio }) {
  const abertura = aberturaOficio({
    tipo: oficio.tipo,
    autorNome: oficio.autor_nome,
    autorGenero: oficio.autor_genero,
    autorAssociadoNome: oficio.autor_associado_nome,
    autorAssociadoGenero: oficio.autor_associado_genero,
  });

  // Sanitiza de novo aqui (já sanitizado ao salvar) — esse HTML roda dentro
  // da própria página que o Puppeteer abre pra gerar o PDF, então vale a
  // camada extra de segurança direto no ponto de renderização.
  const corpoHtml = injetarAberturaHtml(abertura, sanitizarHtmlDocumento(oficio.corpo_texto));

  const fraseEvento =
    oficio.tipo === "convite"
      ? fraseEventoConvite({
          eventoData: oficio.evento_data,
          eventoHora: oficio.evento_hora,
          eventoLocal: oficio.evento_local,
        })
      : null;

  return (
    <PaginaA4>
      <div className="ml-[30mm] mr-[20mm] mt-[32mm] mb-[26mm] flex flex-1 flex-col text-[12pt] leading-relaxed">
        <p className="font-bold">
          {numeroOficioFormatado({ numero: oficio.numero, ano: oficio.ano })}
        </p>
        <p className="mt-4 text-right">{CIDADE}, {dataPorExtenso(oficio.data_oficio)}.</p>

        <div className="mt-6 leading-none">
          <p>Ao {oficio.destinatario_tratamento}</p>
          <p className="font-bold">{oficio.destinatario_nome}</p>
          <p>{oficio.destinatario_cargo}</p>
          {oficio.destinatario_cidade_uf && <p>{oficio.destinatario_cidade_uf}</p>}
        </div>

        <p className="mt-4">
          <strong>Assunto:</strong> {oficio.assunto}
        </p>

        <p className="mt-6">{oficio.saudacao}</p>

        <div
          className="mt-3 space-y-3 text-justify [&>p]:indent-[1.25cm] [&_ol]:list-decimal [&_ol]:pl-[1.25cm] [&_ul]:list-disc [&_ul]:pl-[1.25cm]"
          dangerouslySetInnerHTML={{ __html: corpoHtml }}
        />

        {fraseEvento && <p className="mt-3 indent-[1.25cm] text-justify">{fraseEvento}</p>}

        <p className="mt-6 indent-[1.25cm] text-justify">{oficio.paragrafo_fechamento}</p>

        <p className="mt-6">Atenciosamente,</p>

        <div className="mx-auto mt-[16mm] w-[100mm] text-center leading-none">
          <p className="font-bold uppercase">{SIGNATARIO_OFICIO}</p>
          <p>{PRESIDENTE_CARGO}</p>
          <p>{LEGISLATURA}</p>
        </div>
      </div>
    </PaginaA4>
  );
}
