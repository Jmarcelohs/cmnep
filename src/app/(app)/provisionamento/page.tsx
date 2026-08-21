import { redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { listarContratos, listarFichasAtivas } from "./actions";
import { ProvisionamentoApp } from "./provisionamento-app";

export default async function ProvisionamentoPage() {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/dashboard");

  const [contratos, fichas] = await Promise.all([listarContratos(), listarFichasAtivas()]);

  return <ProvisionamentoApp contratosIniciais={contratos} fichas={fichas} />;
}
