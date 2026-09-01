// Tipos gerados manualmente a partir de supabase/migrations/0001_schema.sql.
// Quando o projeto Supabase estiver criado, prefira regenerar com:
//   npx supabase gen types typescript --project-id <id> > src/lib/supabase/database.types.ts

export type Papel =
  | "admin"
  | "servidor"
  | "ordenador_despesa"
  | "tesoureiro"
  | "controle_interno"
  | "gestor_diarias"
  | "estagiario";

export type Categoria = "Efetivo" | "Comissionado" | "Vereador" | "Estagiário";

export type StatusDiaria = "Solicitado" | "Autorizado" | "Indeferido";

export type ModoItemDiaria = "tabela" | "manual";

export type TipoDiaria = "semPernoite" | "comPernoite";

export type Parecer =
  | "aprovacao_sem_ressalvas"
  | "aprovacao_com_ressalvas"
  | "reprovacao";

export type TipoAnexo = "imagem" | "pdf";

export type TipoAnexoOficio = "imagem" | "pdf" | "word";

export type CargoDeclarado = "Vereador(a)" | "Servidor(a)" | "Estagiário(a)";

export type SubassuntoReembolso =
  | "locomocao"
  | "combustivel"
  | "passagem_aerea"
  | "passagem_onibus";

export type StatusRequerimentoReembolso = "pendente" | "analise" | "deferido" | "indeferido";

export type DecisaoRequerimentoReembolso = "autorizado" | "nao_autorizado";

export type TipoRequerimentoInterno = "rh" | "presidente" | "geral";

export type TipoOficio = "padrao" | "indicacao" | "requerimento" | "convite";
export type TipoDocumentoLegislacao = "lei" | "decreto" | "resolucao" | "portaria" | "ato" | "outro";

export type TratamentoOficio =
  | "Excelentíssimo Senhor"
  | "Excelentíssima Senhora"
  | "Ilustríssimo Senhor"
  | "Ilustríssima Senhora";

export type GeneroVereador = "Vereador" | "Vereadora";

export type StatusRequerimentoInterno = "pendente" | "analise" | "deferido" | "indeferido";

export type DecisaoRequerimentoInterno = "autorizado" | "nao_autorizado";

export type StatusSessaoPlenario = "pendente" | "aprovado" | "recusado";

export type PeriodoAvaliacao = "trimestre_1" | "trimestre_2" | "trimestre_3" | "anual";

export type ConceitoAvaliacao = "otimo" | "muito_bom" | "bom" | "regular" | "insuficiente";

export interface ItemAvaliacaoLancado {
  criterio: string;
  numero: number;
  conceito: ConceitoAvaliacao;
}

export interface AvaliadorLancado {
  nome: string;
  matricula: string | null;
}

export type Tratamento = "Sr." | "Sra.";

// Art. 117 do Regimento Interno da Câmara Municipal de Nepomuceno.
export type TipoMocao = "louvor" | "congratulacoes" | "pesar" | "repudio";

export interface Database {
  public: {
    Tables: {
      usuarios: {
        Row: {
          id: string;
          auth_user_id: string | null;
          nome: string;
          email: string;
          papel: Papel;
          ativo: boolean;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["usuarios"]["Row"], "id">> & {
          nome: string;
          email: string;
          papel: Papel;
        };
        Update: Partial<Database["public"]["Tables"]["usuarios"]["Row"]>;
        Relationships: [];
      };
      pessoas: {
        Row: {
          id: string;
          matricula: string | null;
          nome: string;
          cargo: string;
          categoria: Categoria;
          partido: string | null;
          genero: "M" | "F" | null;
          usuario_id: string | null;
          ativo: boolean;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["pessoas"]["Row"], "id">> & {
          nome: string;
          cargo: string;
          categoria: Categoria;
        };
        Update: Partial<Database["public"]["Tables"]["pessoas"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "pessoas_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
        ];
      };
      pessoas_dados_sensiveis: {
        Row: {
          pessoa_id: string;
          cpf: string | null;
          atualizado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["pessoas_dados_sensiveis"]["Row"], "pessoa_id">> & {
          pessoa_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["pessoas_dados_sensiveis"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "pessoas_dados_sensiveis_pessoa_id_fkey";
            columns: ["pessoa_id"];
            isOneToOne: true;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
        ];
      };
      diarias_tabela_valores: {
        Row: {
          id: string;
          portaria: string;
          vigente_desde: string;
          tipo: TipoDiaria;
          faixa: string;
          categoria: Categoria;
          valor: number;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["diarias_tabela_valores"]["Row"], "id">> & {
          portaria: string;
          vigente_desde: string;
          tipo: TipoDiaria;
          faixa: string;
          categoria: Categoria;
          valor: number;
        };
        Update: Partial<Database["public"]["Tables"]["diarias_tabela_valores"]["Row"]>;
        Relationships: [];
      };
      diarias_solicitacoes: {
        Row: {
          id: string;
          pessoa_id: string;
          numero_diaria: string | null;
          numero_solicitacao: string | null;
          fundamento_legal: string;
          data_solicitacao: string | null;
          data_partida: string | null;
          data_chegada: string | null;
          municipio_origem: string;
          municipio_destino: string | null;
          uf_destino: string | null;
          instituicao_destino: string | null;
          contato_destino: string | null;
          finalidade: string | null;
          ordenador_despesa: string;
          status: StatusDiaria;
          data_autorizacao: string | null;
          total: number;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["diarias_solicitacoes"]["Row"], "id">> & {
          pessoa_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["diarias_solicitacoes"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "diarias_solicitacoes_pessoa_id_fkey";
            columns: ["pessoa_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diarias_solicitacoes_criado_por_fkey";
            columns: ["criado_por"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
        ];
      };
      diarias_itens: {
        Row: {
          id: string;
          solicitacao_id: string;
          modo: ModoItemDiaria;
          categoria: Categoria | null;
          tipo: TipoDiaria | null;
          faixa: string | null;
          descricao_manual: string | null;
          quantidade: number;
          valor_unitario: number;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["diarias_itens"]["Row"], "id">> & {
          solicitacao_id: string;
          modo: ModoItemDiaria;
        };
        Update: Partial<Database["public"]["Tables"]["diarias_itens"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "diarias_itens_solicitacao_id_fkey";
            columns: ["solicitacao_id"];
            isOneToOne: false;
            referencedRelation: "diarias_solicitacoes";
            referencedColumns: ["id"];
          },
        ];
      };
      diarias_prestacoes_contas: {
        Row: {
          id: string;
          solicitacao_id: string | null;
          pessoa_id: string;
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
          ordenador_despesa: string;
          data_aprovacao_ordenador: string | null;
          tesoureiro_nome: string | null;
          data_baixa: string | null;
          parecer: Parecer | null;
          parecer_observacao: string | null;
          parecer_data: string | null;
          controle_interno_nome: string;
          controle_interno_cargo: string;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["diarias_prestacoes_contas"]["Row"], "id">> & {
          pessoa_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["diarias_prestacoes_contas"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "diarias_prestacoes_contas_solicitacao_id_fkey";
            columns: ["solicitacao_id"];
            isOneToOne: false;
            referencedRelation: "diarias_solicitacoes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "diarias_prestacoes_contas_pessoa_id_fkey";
            columns: ["pessoa_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
        ];
      };
      diarias_prestacoes_pagamentos: {
        Row: {
          id: string;
          prestacao_id: string;
          numero_processo: string | null;
          valor: number;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["diarias_prestacoes_pagamentos"]["Row"], "id">> & {
          prestacao_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["diarias_prestacoes_pagamentos"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "diarias_prestacoes_pagamentos_prestacao_id_fkey";
            columns: ["prestacao_id"];
            isOneToOne: false;
            referencedRelation: "diarias_prestacoes_contas";
            referencedColumns: ["id"];
          },
        ];
      };
      diarias_prestacoes_pagamentos_anexos: {
        Row: {
          id: string;
          pagamento_id: string;
          caminho: string;
          nome_original: string;
          tipo: TipoAnexo;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<
          Omit<Database["public"]["Tables"]["diarias_prestacoes_pagamentos_anexos"]["Row"], "id">
        > & {
          pagamento_id: string;
          caminho: string;
          nome_original: string;
          tipo: TipoAnexo;
        };
        Update: Partial<Database["public"]["Tables"]["diarias_prestacoes_pagamentos_anexos"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "diarias_prestacoes_pagamentos_anexos_pagamento_id_fkey";
            columns: ["pagamento_id"];
            isOneToOne: false;
            referencedRelation: "diarias_prestacoes_pagamentos";
            referencedColumns: ["id"];
          },
        ];
      };
      diarias_prestacoes_anexos: {
        Row: {
          id: string;
          prestacao_id: string;
          caminho: string;
          nome_original: string;
          tipo: TipoAnexo;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["diarias_prestacoes_anexos"]["Row"], "id">> & {
          prestacao_id: string;
          caminho: string;
          nome_original: string;
          tipo: TipoAnexo;
        };
        Update: Partial<Database["public"]["Tables"]["diarias_prestacoes_anexos"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "diarias_prestacoes_anexos_prestacao_id_fkey";
            columns: ["prestacao_id"];
            isOneToOne: false;
            referencedRelation: "diarias_prestacoes_contas";
            referencedColumns: ["id"];
          },
        ];
      };
      requerimentos: {
        Row: {
          id: string;
          pessoa_id: string;
          categoria: "RH" | "Ao Presidente" | "Geral" | null;
          conteudo: string | null;
          status: string;
          autorizado_por: string | null;
          data_autorizacao: string | null;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["requerimentos"]["Row"], "id">> & {
          pessoa_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["requerimentos"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "requerimentos_pessoa_id_fkey";
            columns: ["pessoa_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
        ];
      };
      requerimentos_reembolso: {
        Row: {
          id: string;
          protocolo: string;
          pessoa_id: string;
          cargo_declarado: CargoDeclarado;
          cpf: string | null;
          data_requerimento: string;
          subassunto: SubassuntoReembolso;
          data_ida: string;
          data_volta: string;
          municipio: string;
          valor: number;
          solicitacao_diaria_id: string | null;
          solicitacao_veiculo_id: string | null;
          placa_veiculo: string | null;
          modelo_veiculo: string | null;
          status: StatusRequerimentoReembolso;
          decisao: DecisaoRequerimentoReembolso | null;
          decisao_data: string | null;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["requerimentos_reembolso"]["Row"], "id">> & {
          protocolo: string;
          pessoa_id: string;
          cargo_declarado: CargoDeclarado;
          subassunto: SubassuntoReembolso;
          data_ida: string;
          data_volta: string;
          municipio: string;
        };
        Update: Partial<Database["public"]["Tables"]["requerimentos_reembolso"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "requerimentos_reembolso_pessoa_id_fkey";
            columns: ["pessoa_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requerimentos_reembolso_solicitacao_diaria_id_fkey";
            columns: ["solicitacao_diaria_id"];
            isOneToOne: false;
            referencedRelation: "diarias_solicitacoes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "requerimentos_reembolso_solicitacao_veiculo_id_fkey";
            columns: ["solicitacao_veiculo_id"];
            isOneToOne: false;
            referencedRelation: "veiculos_locacao_solicitacoes";
            referencedColumns: ["id"];
          },
        ];
      };
      requerimentos_reembolso_anexos: {
        Row: {
          id: string;
          requerimento_id: string;
          caminho: string;
          nome_original: string;
          tipo: TipoAnexo;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["requerimentos_reembolso_anexos"]["Row"], "id">> & {
          requerimento_id: string;
          caminho: string;
          nome_original: string;
          tipo: TipoAnexo;
        };
        Update: Partial<Database["public"]["Tables"]["requerimentos_reembolso_anexos"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "requerimentos_reembolso_anexos_requerimento_id_fkey";
            columns: ["requerimento_id"];
            isOneToOne: false;
            referencedRelation: "requerimentos_reembolso";
            referencedColumns: ["id"];
          },
        ];
      };
      requerimentos_internos: {
        Row: {
          id: string;
          numero: string;
          ano: number;
          tipo: TipoRequerimentoInterno;
          status: StatusRequerimentoInterno;
          decisao: DecisaoRequerimentoInterno | null;
          decisao_data: string | null;
          pessoa_id: string | null;
          nome: string;
          cargo: CargoDeclarado;
          cpf: string | null;
          matricula: string | null;
          data_requerimento: string;
          assunto_key: string | null;
          assunto: string;
          subassunto_key: string | null;
          fundamento: string | null;
          campos: Record<string, string>;
          pedido: string | null;
          referente_a: string | null;
          valor: number | null;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["requerimentos_internos"]["Row"], "id">> & {
          numero: string;
          ano: number;
          tipo: TipoRequerimentoInterno;
          nome: string;
          cargo: CargoDeclarado;
          assunto: string;
        };
        Update: Partial<Database["public"]["Tables"]["requerimentos_internos"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "requerimentos_internos_pessoa_id_fkey";
            columns: ["pessoa_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
        ];
      };
      veiculos_locacao_itens: {
        Row: {
          id: string;
          processo: string;
          locadora: string;
          codigo: string;
          descricao: string;
          faixa_km: string | null;
          valor_diaria: number;
          ativo: boolean;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["veiculos_locacao_itens"]["Row"], "id">> & {
          codigo: string;
          descricao: string;
          valor_diaria: number;
        };
        Update: Partial<Database["public"]["Tables"]["veiculos_locacao_itens"]["Row"]>;
        Relationships: [];
      };
      veiculos_locacao_solicitacoes: {
        Row: {
          id: string;
          numero: string;
          ano: number;
          data_pedido: string;
          processo: string;
          locadora: string;
          pessoa_solicitante_id: string | null;
          solicitante_nome: string;
          solicitante_matricula: string | null;
          solicitante_cargo: string | null;
          pessoa_condutor_id: string | null;
          condutor_nome: string;
          condutor_matricula: string | null;
          condutor_cargo: string | null;
          item_id: string | null;
          veiculo_descricao: string;
          valor_diaria: number;
          qtd_diarias: number;
          valor_total: number;
          data_retirada: string;
          hora_retirada: string | null;
          local_retirada: string | null;
          data_devolucao: string;
          hora_devolucao: string | null;
          local_devolucao: string | null;
          observacoes: string | null;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["veiculos_locacao_solicitacoes"]["Row"], "id">> & {
          numero: string;
          ano: number;
          solicitante_nome: string;
          condutor_nome: string;
          veiculo_descricao: string;
          data_retirada: string;
          data_devolucao: string;
        };
        Update: Partial<Database["public"]["Tables"]["veiculos_locacao_solicitacoes"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "veiculos_locacao_solicitacoes_pessoa_solicitante_id_fkey";
            columns: ["pessoa_solicitante_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "veiculos_locacao_solicitacoes_pessoa_condutor_id_fkey";
            columns: ["pessoa_condutor_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "veiculos_locacao_solicitacoes_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "veiculos_locacao_itens";
            referencedColumns: ["id"];
          },
        ];
      };
      emendas_impositivas: {
        Row: {
          id: string;
          vereador_id: string | null;
          entidade: string | null;
          secretaria: string | null;
          valor: number | null;
          ano_loa: number;
          status: string;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["emendas_impositivas"]["Row"], "id">>;
        Update: Partial<Database["public"]["Tables"]["emendas_impositivas"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "emendas_impositivas_vereador_id_fkey";
            columns: ["vereador_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
        ];
      };
      veiculos_solicitacoes: {
        Row: {
          id: string;
          pessoa_id: string;
          numero_solicitacao: string | null;
          data_uso: string | null;
          destino: string | null;
          finalidade: string | null;
          status: string;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["veiculos_solicitacoes"]["Row"], "id">> & {
          pessoa_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["veiculos_solicitacoes"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "veiculos_solicitacoes_pessoa_id_fkey";
            columns: ["pessoa_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
        ];
      };
      avaliacoes_avaliadores: {
        Row: {
          id: string;
          nome: string;
          matricula: string | null;
          ativo: boolean;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["avaliacoes_avaliadores"]["Row"], "id">> & {
          nome: string;
        };
        Update: Partial<Database["public"]["Tables"]["avaliacoes_avaliadores"]["Row"]>;
        Relationships: [];
      };
      avaliacoes: {
        Row: {
          id: string;
          pessoa_id: string;
          ano: number;
          periodo: PeriodoAvaliacao;
          template: string;
          data_avaliacao: string;
          em_estagio_probatorio: boolean;
          avaliadores: AvaliadorLancado[];
          itens: ItemAvaliacaoLancado[];
          pontos_melhorar: string | null;
          pontos_positivos: string | null;
          nota_final: number | null;
          criado_por: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["avaliacoes"]["Row"], "id">> & {
          pessoa_id: string;
          ano: number;
          periodo: PeriodoAvaliacao;
        };
        Update: Partial<Database["public"]["Tables"]["avaliacoes"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "avaliacoes_pessoa_id_fkey";
            columns: ["pessoa_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
        ];
      };
      decretos_titulo_honorario: {
        Row: {
          id: string;
          numero: string;
          ano: number;
          data_decreto: string;
          tratamento: Tratamento;
          nome_homenageado: string;
          autor_nome: string;
          autor_partido: string | null;
          dotacao_orcamentaria: string;
          justificativa: string;
          foto_caminho: string | null;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["decretos_titulo_honorario"]["Row"], "id">> & {
          numero: string;
          ano: number;
          nome_homenageado: string;
          autor_nome: string;
        };
        Update: Partial<Database["public"]["Tables"]["decretos_titulo_honorario"]["Row"]>;
        Relationships: [];
      };
      vereadores: {
        Row: {
          id: string;
          nome: string;
          partido: string | null;
          genero: GeneroVereador;
          presidente: boolean;
          assinatura_caminho: string | null;
          ativo: boolean;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["vereadores"]["Row"], "id">> & {
          nome: string;
        };
        Update: Partial<Database["public"]["Tables"]["vereadores"]["Row"]>;
        Relationships: [];
      };
      mocoes: {
        Row: {
          id: string;
          tipo: TipoMocao;
          data_mocao: string;
          destinatario: string;
          destinatario_tratamento: Tratamento | null;
          autor_vereador_id: string;
          associados_vereadores_ids: string[];
          justificativa: string;
          lote_id: string | null;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["mocoes"]["Row"], "id">> & {
          tipo: TipoMocao;
          destinatario: string;
          autor_vereador_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["mocoes"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "mocoes_autor_vereador_id_fkey";
            columns: ["autor_vereador_id"];
            isOneToOne: false;
            referencedRelation: "vereadores";
            referencedColumns: ["id"];
          },
        ];
      };
      oficios: {
        Row: {
          id: string;
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
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["oficios"]["Row"], "id">> & {
          tipo: TipoOficio;
          numero: string;
          ano: number;
          destinatario_nome: string;
          destinatario_cargo: string;
          assunto: string;
        };
        Update: Partial<Database["public"]["Tables"]["oficios"]["Row"]>;
        Relationships: [];
      };
      oficios_anexos: {
        Row: {
          id: string;
          oficio_id: string;
          caminho: string;
          nome_original: string;
          tipo: TipoAnexoOficio;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["oficios_anexos"]["Row"], "id">> & {
          oficio_id: string;
          caminho: string;
          nome_original: string;
          tipo: TipoAnexoOficio;
        };
        Update: Partial<Database["public"]["Tables"]["oficios_anexos"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "oficios_anexos_oficio_id_fkey";
            columns: ["oficio_id"];
            isOneToOne: false;
            referencedRelation: "oficios";
            referencedColumns: ["id"];
          },
        ];
      };
      oficios_diretor_executivo: {
        Row: {
          id: string;
          numero: string;
          ano: number;
          data_oficio: string;
          // Texto livre (não a lista fixa TratamentoOficio) — alguns
          // ofícios do Diretor Executivo são endereçados a um setor do
          // Executivo, sem tratamento de pessoa (ver migration 0044).
          destinatario_tratamento: string;
          destinatario_nome: string;
          // Opcional — nem todo destinatário tem um cargo aplicável (ver
          // migration 0045).
          destinatario_cargo: string | null;
          destinatario_cidade_uf: string | null;
          saudacao: string;
          assunto: string;
          corpo_texto: string;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["oficios_diretor_executivo"]["Row"], "id">> & {
          numero: string;
          ano: number;
          destinatario_nome: string;
          assunto: string;
        };
        Update: Partial<Database["public"]["Tables"]["oficios_diretor_executivo"]["Row"]>;
        Relationships: [];
      };
      oficios_diretor_executivo_anexos: {
        Row: {
          id: string;
          oficio_id: string;
          caminho: string;
          nome_original: string;
          tipo: TipoAnexoOficio;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<
          Omit<Database["public"]["Tables"]["oficios_diretor_executivo_anexos"]["Row"], "id">
        > & {
          oficio_id: string;
          caminho: string;
          nome_original: string;
          tipo: TipoAnexoOficio;
        };
        Update: Partial<Database["public"]["Tables"]["oficios_diretor_executivo_anexos"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "oficios_diretor_executivo_anexos_oficio_id_fkey";
            columns: ["oficio_id"];
            isOneToOne: false;
            referencedRelation: "oficios_diretor_executivo";
            referencedColumns: ["id"];
          },
        ];
      };
      dotacoes_orcamentarias: {
        Row: {
          id: string;
          ficha: number;
          orgao_codigo: string;
          orgao_nome: string;
          unidade_codigo: string;
          unidade_nome: string;
          subfuncao_codigo: string;
          subfuncao_nome: string;
          programa_codigo: string;
          programa_nome: string;
          projeto_atividade_codigo: string;
          projeto_atividade_nome: string;
          elemento_codigo: string;
          elemento_nome: string;
          fonte_codigo: string;
          fonte_nome: string;
          saldo_referencia: number | null;
          saldo_referencia_em: string | null;
          dotacao_inicial_referencia: number | null;
          suplementado_referencia: number | null;
          empenhado_referencia: number | null;
          ativo: boolean;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["dotacoes_orcamentarias"]["Row"], "id">> & {
          ficha: number;
          orgao_codigo: string;
          orgao_nome: string;
          unidade_codigo: string;
          unidade_nome: string;
          subfuncao_codigo: string;
          subfuncao_nome: string;
          programa_codigo: string;
          programa_nome: string;
          projeto_atividade_codigo: string;
          projeto_atividade_nome: string;
          elemento_codigo: string;
          elemento_nome: string;
          fonte_codigo: string;
          fonte_nome: string;
        };
        Update: Partial<Database["public"]["Tables"]["dotacoes_orcamentarias"]["Row"]>;
        Relationships: [];
      };
      orcamento_solicitacoes_atualizacao: {
        Row: {
          id: string;
          solicitado_por: string;
          solicitado_em: string;
        };
        Insert: Partial<
          Omit<Database["public"]["Tables"]["orcamento_solicitacoes_atualizacao"]["Row"], "id">
        > & {
          solicitado_por: string;
        };
        Update: Partial<Database["public"]["Tables"]["orcamento_solicitacoes_atualizacao"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "orcamento_solicitacoes_atualizacao_solicitado_por_fkey";
            columns: ["solicitado_por"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
        ];
      };
      suplementacoes_orcamentarias: {
        Row: {
          id: string;
          data_ato: string;
          numero_decreto: string | null;
          data_decreto: string | null;
          corpo_ato_html: string | null;
          corpo_decreto_html: string | null;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<
          Omit<Database["public"]["Tables"]["suplementacoes_orcamentarias"]["Row"], "id">
        > & {
          data_ato: string;
        };
        Update: Partial<Database["public"]["Tables"]["suplementacoes_orcamentarias"]["Row"]>;
        Relationships: [];
      };
      suplementacoes_itens: {
        Row: {
          id: string;
          suplementacao_id: string;
          ficha_id: string;
          tipo: "destino" | "origem";
          valor: number;
          ordem: number;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["suplementacoes_itens"]["Row"], "id">> & {
          suplementacao_id: string;
          ficha_id: string;
          tipo: "destino" | "origem";
          valor: number;
        };
        Update: Partial<Database["public"]["Tables"]["suplementacoes_itens"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "suplementacoes_itens_suplementacao_id_fkey";
            columns: ["suplementacao_id"];
            isOneToOne: false;
            referencedRelation: "suplementacoes_orcamentarias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "suplementacoes_itens_ficha_id_fkey";
            columns: ["ficha_id"];
            isOneToOne: false;
            referencedRelation: "dotacoes_orcamentarias";
            referencedColumns: ["id"];
          },
        ];
      };
      loa_projecoes: {
        Row: {
          id: string;
          ano: number;
          dotacao_origem_id: string | null;
          orgao_codigo: string;
          orgao_nome: string;
          unidade_codigo: string;
          unidade_nome: string;
          subfuncao_codigo: string;
          subfuncao_nome: string;
          programa_codigo: string;
          programa_nome: string;
          projeto_atividade_codigo: string;
          projeto_atividade_nome: string;
          elemento_codigo: string;
          elemento_nome: string;
          fonte_codigo: string;
          fonte_nome: string;
          valor_projetado: number;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["loa_projecoes"]["Row"], "id">> & {
          orgao_codigo: string;
          orgao_nome: string;
          unidade_codigo: string;
          unidade_nome: string;
          subfuncao_codigo: string;
          subfuncao_nome: string;
          programa_codigo: string;
          programa_nome: string;
          projeto_atividade_codigo: string;
          projeto_atividade_nome: string;
          elemento_codigo: string;
          elemento_nome: string;
          fonte_codigo: string;
          fonte_nome: string;
        };
        Update: Partial<Database["public"]["Tables"]["loa_projecoes"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "loa_projecoes_dotacao_origem_id_fkey";
            columns: ["dotacao_origem_id"];
            isOneToOne: false;
            referencedRelation: "dotacoes_orcamentarias";
            referencedColumns: ["id"];
          },
        ];
      };
      loa_configuracoes: {
        Row: {
          ano: number;
          valor_total: number;
          atualizado_em: string;
        };
        Insert: Partial<Database["public"]["Tables"]["loa_configuracoes"]["Row"]> & {
          ano: number;
        };
        Update: Partial<Database["public"]["Tables"]["loa_configuracoes"]["Row"]>;
        Relationships: [];
      };
      provisionamento_contratos: {
        Row: {
          id: string;
          nome: string;
          fornecedor: string;
          modalidade: "fixo" | "unidade";
          // "fixo": valor_vigente + tipo_valor; "unidade": valor_unitario +
          // unidade_medida + quantidade_estimada_mensal — sempre um par ou
          // outro null, conforme a modalidade (ver migration 0050).
          valor_vigente: number | null;
          tipo_valor: "mensal" | "anual" | null;
          valor_unitario: number | null;
          unidade_medida: string | null;
          quantidade_estimada_mensal: number | null;
          data_inicio_vigencia: string;
          data_fim_vigencia: string;
          data_proximo_reajuste: string;
          indice_correcao: string;
          percentual_estimado: number;
          situacao: "continua" | "vence" | "nova_licitacao";
          valor_novo_contrato_estimado: number | null;
          data_inicio_novo_contrato: string | null;
          ficha_id: string | null;
          observacoes: string;
          criado_por: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: Partial<
          Omit<Database["public"]["Tables"]["provisionamento_contratos"]["Row"], "id">
        > & {
          nome: string;
          modalidade: "fixo" | "unidade";
          data_inicio_vigencia: string;
          data_fim_vigencia: string;
          data_proximo_reajuste: string;
          indice_correcao: string;
          percentual_estimado: number;
          situacao: "continua" | "vence" | "nova_licitacao";
        };
        Update: Partial<Database["public"]["Tables"]["provisionamento_contratos"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "provisionamento_contratos_ficha_id_fkey";
            columns: ["ficha_id"];
            isOneToOne: false;
            referencedRelation: "dotacoes_orcamentarias";
            referencedColumns: ["id"];
          },
        ];
      };
      processos_licitatorios: {
        Row: {
          id: string;
          numero_processo: number;
          ano: number;
          modalidade: "dispensa" | "inexigibilidade" | "pregao";
          numero_modalidade: number;
          data_abertura: string;
          objeto: string;
          ficha_id: string | null;
          dotacao_subelemento: string;
          vinculo_pca: string;
          organizador_pessoa_id: string | null;
          agente_contratacao_pessoa_id: string | null;
          pesquisa_precos_pessoa_id: string | null;
          gestor_contrato_pessoa_id: string | null;
          fiscal_contrato_pessoa_id: string | null;
          tr_solucao_escolhida: string;
          tr_natureza_execucao: "continuada" | "nao_continuada";
          tr_justificativa_natureza: string;
          criado_por: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["processos_licitatorios"]["Row"], "id">> & {
          numero_processo: number;
          ano: number;
          modalidade: "dispensa" | "inexigibilidade" | "pregao";
          numero_modalidade: number;
        };
        Update: Partial<Database["public"]["Tables"]["processos_licitatorios"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "processos_licitatorios_ficha_id_fkey";
            columns: ["ficha_id"];
            isOneToOne: false;
            referencedRelation: "dotacoes_orcamentarias";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "processos_licitatorios_organizador_pessoa_id_fkey";
            columns: ["organizador_pessoa_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "processos_licitatorios_agente_contratacao_pessoa_id_fkey";
            columns: ["agente_contratacao_pessoa_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "processos_licitatorios_pesquisa_precos_pessoa_id_fkey";
            columns: ["pesquisa_precos_pessoa_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "processos_licitatorios_gestor_contrato_pessoa_id_fkey";
            columns: ["gestor_contrato_pessoa_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "processos_licitatorios_fiscal_contrato_pessoa_id_fkey";
            columns: ["fiscal_contrato_pessoa_id"];
            isOneToOne: false;
            referencedRelation: "pessoas";
            referencedColumns: ["id"];
          },
        ];
      };
      processos_licitatorios_itens: {
        Row: {
          id: string;
          processo_id: string;
          numero_item: number;
          objeto: string;
          unidade: string;
          quantidade: number;
          valor_unitario: number | null;
          valor_global: number | null;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["processos_licitatorios_itens"]["Row"], "id">> & {
          processo_id: string;
          numero_item: number;
        };
        Update: Partial<Database["public"]["Tables"]["processos_licitatorios_itens"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "processos_licitatorios_itens_processo_id_fkey";
            columns: ["processo_id"];
            isOneToOne: false;
            referencedRelation: "processos_licitatorios";
            referencedColumns: ["id"];
          },
        ];
      };
      processos_licitatorios_documentos: {
        Row: {
          id: string;
          processo_id: string;
          tipo:
            | "capa"
            | "dfd"
            | "etp"
            | "tr"
            | "certidao_valor"
            | "solicitacao_abertura"
            | "termo_aceite"
            | "solicitacao_compra"
            | "solicitacao_orcamento"
            | "certidao_orcamento"
            | "solicitacao_parecer_juridico"
            | "aviso"
            | "termo_aviso"
            | "ata_julgamento"
            | "despacho"
            | "relatorio_publicacao"
            | "autuacao";
          corpo_html: string;
          criado_por: string | null;
          criado_em: string;
          atualizado_em: string;
        };
        Insert: Partial<
          Omit<Database["public"]["Tables"]["processos_licitatorios_documentos"]["Row"], "id">
        > & {
          processo_id: string;
          tipo: Database["public"]["Tables"]["processos_licitatorios_documentos"]["Row"]["tipo"];
        };
        Update: Partial<Database["public"]["Tables"]["processos_licitatorios_documentos"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "processos_licitatorios_documentos_processo_id_fkey";
            columns: ["processo_id"];
            isOneToOne: false;
            referencedRelation: "processos_licitatorios";
            referencedColumns: ["id"];
          },
        ];
      };
      legislacao_documentos: {
        Row: {
          id: string;
          titulo: string;
          tipo: TipoDocumentoLegislacao;
          numero: string | null;
          ano: number | null;
          descricao: string | null;
          caminho: string;
          nome_original: string;
          tipo_arquivo: TipoAnexoOficio;
          conteudo_texto: string | null;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["legislacao_documentos"]["Row"], "id">> & {
          id?: string;
          titulo: string;
          tipo: TipoDocumentoLegislacao;
          caminho: string;
          nome_original: string;
          tipo_arquivo: TipoAnexoOficio;
        };
        Update: Partial<Database["public"]["Tables"]["legislacao_documentos"]["Row"]>;
        Relationships: [];
      };
      sessoes_plenario_decisoes: {
        Row: {
          id: string;
          resposta_timestamp: string;
          status: StatusSessaoPlenario;
          decidido_por: string | null;
          decidido_em: string | null;
          evento_agenda_id: string | null;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["sessoes_plenario_decisoes"]["Row"], "id">> & {
          id?: string;
          resposta_timestamp: string;
          status: StatusSessaoPlenario;
        };
        Update: Partial<Database["public"]["Tables"]["sessoes_plenario_decisoes"]["Row"]>;
        Relationships: [];
      };
      oficios_modelos: {
        Row: {
          id: string;
          nome_modelo: string;
          tipo: TipoOficio;
          assunto: string;
          corpo_texto: string;
          paragrafo_fechamento: string;
          criado_por: string | null;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["oficios_modelos"]["Row"], "id">> & {
          nome_modelo: string;
          tipo: TipoOficio;
        };
        Update: Partial<Database["public"]["Tables"]["oficios_modelos"]["Row"]>;
        Relationships: [];
      };
      mensagens_diretas: {
        Row: {
          id: string;
          remetente_id: string;
          destinatario_id: string;
          conteudo: string;
          lida: boolean;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["mensagens_diretas"]["Row"], "id">> & {
          remetente_id: string;
          destinatario_id: string;
          conteudo: string;
        };
        Update: Partial<Database["public"]["Tables"]["mensagens_diretas"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "mensagens_diretas_remetente_id_fkey";
            columns: ["remetente_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mensagens_diretas_destinatario_id_fkey";
            columns: ["destinatario_id"];
            isOneToOne: false;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
        ];
      };
      presenca_usuarios: {
        Row: {
          usuario_id: string;
          ultima_atividade: string;
        };
        Insert: Partial<Database["public"]["Tables"]["presenca_usuarios"]["Row"]> & {
          usuario_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["presenca_usuarios"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "presenca_usuarios_usuario_id_fkey";
            columns: ["usuario_id"];
            isOneToOne: true;
            referencedRelation: "usuarios";
            referencedColumns: ["id"];
          },
        ];
      };
      autoridades: {
        Row: {
          id: string;
          tratamento: TratamentoOficio;
          nome: string;
          cargo: string;
          cidade_uf: string | null;
          ativo: boolean;
          criado_em: string;
        };
        Insert: Partial<Omit<Database["public"]["Tables"]["autoridades"]["Row"], "id">> & {
          nome: string;
          cargo: string;
        };
        Update: Partial<Database["public"]["Tables"]["autoridades"]["Row"]>;
        Relationships: [];
      };
      auditoria: {
        Row: {
          id: string;
          tabela: string;
          registro_id: string | null;
          operacao: "INSERT" | "UPDATE" | "DELETE";
          dados_antigos: Record<string, unknown> | null;
          dados_novos: Record<string, unknown> | null;
          usuario_id: string | null;
          usuario_nome: string | null;
          criado_em: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      proximo_protocolo_requerimento: {
        Args: { p_ano: number };
        Returns: number;
      };
      proximo_protocolo_requerimento_interno: {
        Args: { p_tipo: string; p_ano: number };
        Returns: number;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
