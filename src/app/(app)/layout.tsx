import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { AppShell } from "./app-shell";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Painel" },
  { href: "/diarias", label: "Diárias de Viagem" },
  { href: "/requerimentos-internos", label: "Requerimentos Internos" },
  { href: "/requerimentos", label: "Reembolso" },
  { href: "/veiculos", label: "Veículos" },
  { href: "/decretos", label: "Decretos" },
  { href: "/pessoas", label: "Pessoas" },
  { href: "/avaliacoes", label: "Avaliações" },
];

const NAV_ITEMS_ADMIN = [
  { href: "/usuarios", label: "Usuários" },
  { href: "/auditoria", label: "Auditoria" },
];

// Abas que servidor não precisa ver — não são do dia a dia dele
// (gestão de pessoas, avaliações e veículos são operadas por
// ordenador da despesa/admin/gestor de diárias).
const HREFS_OCULTOS_SERVIDOR = ["/pessoas", "/avaliacoes", "/veiculos"];

// Gestor de Diárias é um servidor comum "elevado" só em Diárias,
// Reembolso e Veículos — por isso continua sem ver Pessoas/Avaliações,
// mas Veículos (que é justamente um dos 3 módulos elevados) não entra
// na lista de ocultos dele.
const HREFS_OCULTOS_GESTOR_DIARIAS = ["/pessoas", "/avaliacoes"];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await getCurrentUsuario();
  const hrefsOcultos =
    usuario?.papel === "servidor"
      ? HREFS_OCULTOS_SERVIDOR
      : usuario?.papel === "gestor_diarias"
        ? HREFS_OCULTOS_GESTOR_DIARIAS
        : [];
  const itensBase = NAV_ITEMS.filter((item) => !hrefsOcultos.includes(item.href));
  const navItems = [...itensBase, ...(usuario?.papel === "admin" ? NAV_ITEMS_ADMIN : [])];

  return (
    <AppShell usuario={usuario} navItems={navItems}>
      {children}
    </AppShell>
  );
}
