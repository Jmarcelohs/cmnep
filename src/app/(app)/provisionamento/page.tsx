import { redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { ProvisionamentoApp } from "./provisionamento-app";

// Módulo inteiro é client-side (dados no localStorage do navegador, ver
// src/lib/provisionamento/tipos.ts) — este page.tsx só existe pra manter o
// mesmo controle de acesso admin-only já usado em Suplementações
// Orçamentárias (é uma ferramenta de planejamento orçamentário, mesma
// sensibilidade).
export default async function ProvisionamentoPage() {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel !== "admin") redirect("/dashboard");

  return <ProvisionamentoApp />;
}
