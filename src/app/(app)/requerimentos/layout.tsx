import { redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";

// Estagiário não tem acesso a Reembolsos (nem sequer os próprios).
export default async function RequerimentosLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel === "estagiario") redirect("/dashboard");

  return <>{children}</>;
}
