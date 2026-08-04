"use client";

export function ExcluirSolicitacaoButton({
  action,
  size = "sm",
  variant = "pill",
  mensagemConfirmacao = "Tem certeza que deseja excluir essa solicitação de diária? Essa ação não pode ser desfeita.",
  label = "Excluir",
}: {
  action: () => Promise<void>;
  size?: "sm" | "md";
  // "pill": botão isolado (uso solto, fora de menu). "menu": item de
  // largura cheia pra empilhar dentro do MenuAcoes.
  variant?: "pill" | "menu";
  mensagemConfirmacao?: string;
  label?: string;
}) {
  const classes =
    variant === "menu"
      ? "block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
      : size === "md"
        ? "rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
        : "rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50";

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(mensagemConfirmacao)) {
          e.preventDefault();
        }
      }}
    >
      <button type="submit" className={classes}>
        {label}
      </button>
    </form>
  );
}
