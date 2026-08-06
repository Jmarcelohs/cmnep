// Base de Formatação para Documentos da Câmara Municipal de Nepomuceno —
// fonte oficial: "Base de Formatação.pdf" (Manual de Redação da
// Presidência da República + ABNT NBR 6023/6024 + Visual Law).
//
// Aplica-se aos documentos "carta/prosa" gerados pelo sistema (Decretos,
// Ofícios, Requerimentos Internos, Veículos). Os formulários tabulares
// densos (Anexo I/II de Diárias, Requerimento de Reembolso, Avaliações)
// têm colunas já dimensionadas pra fontes menores e são tratados à parte
// — ver o memo camara-nepomuceno-base-formatacao para o histórico da
// decisão.

// Fonte já é Arial em todo o app (ver src/app/globals.css) — uma das duas
// opções permitidas pelo guia (a outra é Times New Roman).

export const MARGEM_ESQUERDA = "30mm"; // 3 cm
export const MARGEM_DIREITA = "20mm"; // 2 cm

export const TAMANHO_FONTE_PRINCIPAL = "12pt";

// Recuo de primeira linha dos parágrafos de corpo — não se aplica a
// blocos de endereçamento/assinatura/título (linhas curtas, centralizadas
// ou alinhadas à direita, não "parágrafos" no sentido do guia).
export const RECUO_PRIMEIRA_LINHA = "1.25cm";

export const RECUO_LISTA = "1.25cm";
