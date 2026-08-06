"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/logout-button";
import { BotaoSuporteWhatsapp } from "@/components/botao-suporte-whatsapp";
import { useChatPresenca } from "./chat-provider";
import type { NavEntry } from "./layout";

type Usuario = { nome: string; papel: string } | null;

function ehGrupo(item: NavEntry): item is Extract<NavEntry, { items: unknown[] }> {
  return "items" in item;
}

// Compara só o caminho, ignorando querystring — "/diarias?prestacao=..."
// e "/diarias" contam como o mesmo caminho pra fins de destaque do menu.
function ativoPara(href: string, pathname: string) {
  const caminho = href.split("?")[0];
  return pathname === caminho || pathname.startsWith(`${caminho}/`);
}

function NavLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: NavEntry[];
  pathname: string;
  onNavigate?: () => void;
}) {
  const { totalNaoLidas } = useChatPresenca();
  const [gruposAbertos, setGruposAbertos] = useState<Set<string>>(() => {
    const abertos = new Set<string>();
    for (const item of items) {
      if (ehGrupo(item) && item.items.some((sub) => ativoPara(sub.href, pathname))) {
        abertos.add(item.label);
      }
    }
    return abertos;
  });

  function alternarGrupo(label: string) {
    setGruposAbertos((prev) => {
      const novo = new Set(prev);
      if (novo.has(label)) novo.delete(label);
      else novo.add(label);
      return novo;
    });
  }

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {items.map((item) => {
        if (ehGrupo(item)) {
          const aberto = gruposAbertos.has(item.label);
          const grupoAtivo = item.items.some((sub) => ativoPara(sub.href, pathname));
          const idGrupo = `grupo-nav-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          return (
            <div key={item.label}>
              <button
                type="button"
                onClick={() => alternarGrupo(item.label)}
                aria-expanded={aberto}
                aria-controls={idGrupo}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  grupoAtivo ? "text-white" : "text-white/70 hover:text-white"
                }`}
              >
                {item.label}
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 12 12"
                  fill="none"
                  className={`shrink-0 transition-transform ${aberto ? "rotate-180" : ""}`}
                >
                  <path
                    d="M2 4l4 4 4-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {aberto && (
                <div id={idGrupo} className="mt-1 ml-2 flex flex-col gap-1 border-l border-white/10 pl-3">
                  {item.items.map((sub) => {
                    const ativo = ativoPara(sub.href, pathname);
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={onNavigate}
                        className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                          ativo
                            ? "bg-white/15 font-medium text-white"
                            : "text-white/60 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        const ativo = ativoPara(item.href, pathname);
        // "Mensagens" usa o contador ao vivo do ChatProvider (semeado pelo
        // valor calculado no servidor) — os demais ficam só com o valor
        // calculado por requisição, sem atualização em tempo real.
        const badge = item.href === "/mensagens" ? totalNaoLidas : item.badge;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              ativo ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}
          >
            {item.label}
            {Boolean(badge) && (
              <span className="ml-2 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-semibold text-white">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function Logo({ className = "h-10 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/timbrado/logo.png"
      alt="Câmara Municipal de Nepomuceno"
      width={690}
      height={300}
      priority
      className={className}
    />
  );
}

function RodapeUsuario({ usuario }: { usuario: Usuario }) {
  return (
    <div className="m-4 border-t border-white/10 pt-4">
      {usuario && (
        <p className="px-3 text-xs text-white/60">
          {usuario.nome} · {usuario.papel}
        </p>
      )}
      <div className="mt-2 px-3">
        <LogoutButton />
      </div>
    </div>
  );
}

export function AppShell({
  usuario,
  navItems,
  children,
}: {
  usuario: Usuario;
  navItems: NavEntry[];
  children: React.ReactNode;
}) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();
  const botaoFecharRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aberto) return;

    // Move o foco pro drawer ao abrir (senão fica preso no botão de
    // hambúrguer, que agora está fora da tela) e fecha com Escape.
    botaoFecharRef.current?.focus();

    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") setAberto(false);
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar fixa (telas grandes) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-64 lg:flex-col lg:overflow-y-auto lg:bg-brand-navy">
        <div className="m-4 rounded-lg bg-white p-3">
          <Logo />
        </div>
        <NavLinks items={navItems} pathname={pathname} />
        <RodapeUsuario usuario={usuario} />
      </aside>

      {/* Barra superior (telas pequenas) */}
      <header className="flex items-center justify-between bg-brand-navy px-4 py-3 lg:hidden">
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          className="rounded-md p-1 text-white/80 hover:text-white"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
        <Logo className="h-8 w-auto rounded bg-white p-1" />
        <span className="w-6" />
      </header>

      {/* Menu deslizante (telas pequenas) */}
      {aberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setAberto(false)} />
          <aside className="fixed inset-y-0 left-0 flex w-64 flex-col overflow-y-auto bg-brand-navy shadow-xl">
            <div className="m-4 flex items-center justify-between">
              <div className="rounded-lg bg-white p-3">
                <Logo />
              </div>
              <button
                ref={botaoFecharRef}
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar menu"
                className="rounded-md p-1 text-white/80 hover:text-white"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <NavLinks items={navItems} pathname={pathname} onNavigate={() => setAberto(false)} />
            <RodapeUsuario usuario={usuario} />
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-4 py-8">{children}</div>
      </main>

      <BotaoSuporteWhatsapp />
    </div>
  );
}
