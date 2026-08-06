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

export type TratamentoOficio = "Excelentíssimo Senhor" | "Excelentíssima Senhora";

export type GeneroVereador = "Vereador" | "Vereadora";

export type StatusRequerimentoInterno = "pendente" | "analise" | "deferido" | "indeferido";

export type DecisaoRequerimentoInterno = "autorizado" | "nao_autorizado";

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
