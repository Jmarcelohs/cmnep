import { redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";

// Estagiário não tem acesso a Diárias (nem sequer as próprias) — diferente
// dos outros papéis "escondidos do nav" (ex.: Pessoas pra servidor), que
// continuam acessíveis por URL direta. Aqui o bloqueio é de verdade.
export default async function DiariasLayout({ children }: { children: React.ReactNode }) {
  const usuario = await getCurrentUsuario();
  if (usuario?.papel === "estagiario") redirect("/dashboard");

  return <>{children}</>;
}
