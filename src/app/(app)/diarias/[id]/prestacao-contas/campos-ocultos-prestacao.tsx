import type { ValoresIniciaisPrestacao } from "./nova-prestacao-form";

// As actions de criar/editar sempre leem relatorio_resultado e os 8 campos
// do demonstrativo financeiro do formData inteiro, mesmo quando a etapa que
// submeteu só mostra parte dos campos — esses componentes carregam o valor
// atual escondido, pra não apagar o que já foi salvo numa etapa anterior.

export function CampoOcultoRelatorio({ relatorio }: { relatorio: string }) {
  return <input type="hidden" name="relatorio_resultado" value={relatorio} />;
}

export function CamposOcultosFinanceiro({
  valorAutorizado,
  valoresIniciais,
}: {
  valorAutorizado: number;
  valoresIniciais?: Omit<ValoresIniciaisPrestacao, "relatorio_resultado">;
}) {
  return (
    <>
      <input
        type="hidden"
        name="debito_diarias_previstas"
        value={valoresIniciais?.debito_diarias_previstas ?? valorAutorizado}
      />
      <input
        type="hidden"
        name="debito_diarias_nao_previstas"
        value={valoresIniciais?.debito_diarias_nao_previstas ?? 0}
      />
      <input
        type="hidden"
        name="debito_transporte_aereo"
        value={valoresIniciais?.debito_transporte_aereo ?? 0}
      />
      <input
        type="hidden"
        name="debito_transporte_urbano"
        value={valoresIniciais?.debito_transporte_urbano ?? 0}
      />
      <input
        type="hidden"
        name="credito_recebidas_antecipadamente"
        value={valoresIniciais?.credito_recebidas_antecipadamente ?? 0}
      />
      <input
        type="hidden"
        name="credito_reembolsar"
        value={valoresIniciais?.credito_reembolsar ?? 0}
      />
      <input
        type="hidden"
        name="credito_transporte_urbano"
        value={valoresIniciais?.credito_transporte_urbano ?? 0}
      />
      <input
        type="hidden"
        name="credito_devolver"
        value={valoresIniciais?.credito_devolver ?? 0}
      />
    </>
  );
}
