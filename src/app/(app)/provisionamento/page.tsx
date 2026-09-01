import { redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { listarContratos, listarFichasAtivas, listarLoaProjecao } from "./actions";
import { ProvisionamentoApp } from "./provisionamento-app";

export default async function ProvisionamentoPage() {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/dashboard");

  const [contratos, fichas, loaProjecao] = await Promise.all([
    listarContratos(),
    listarFichasAtivas(),
    listarLoaProjecao(),
  ]);

  return (
    <ProvisionamentoApp contratosIniciais={contratos} fichas={fichas} loaProjecaoInicial={loaProjecao} />
  );
}
