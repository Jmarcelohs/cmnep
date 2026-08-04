import { describe, expect, it } from "vitest";
import { NAV_ESTRUTURA, filtrarNav, podeVer } from "./nav";
import type { NavEntry, NavGroup, NavLeaf } from "./nav";

describe("podeVer", () => {
  it("item sem restrição é visível pra qualquer papel, inclusive sem login", () => {
    expect(podeVer({ href: "/dashboard", label: "Painel" }, undefined)).toBe(true);
    expect(podeVer({ href: "/dashboard", label: "Painel" }, "servidor")).toBe(true);
  });

  it("item com 'apenas' só aparece pros papéis listados", () => {
    const item: NavLeaf = { href: "/usuarios", label: "Usuários", apenas: ["admin"] };
    expect(podeVer(item, "admin")).toBe(true);
    expect(podeVer(item, "servidor")).toBe(false);
    expect(podeVer(item, undefined)).toBe(false);
  });

  it("item com 'oculto' aparece pra todo mundo menos os papéis listados", () => {
    const item: NavLeaf = { href: "/veiculos", label: "Veículos", oculto: ["servidor"] };
    expect(podeVer(item, "servidor")).toBe(false);
    expect(podeVer(item, "admin")).toBe(true);
    expect(podeVer(item, undefined)).toBe(true);
  });
});

describe("filtrarNav", () => {
  it("remove grupos que ficam sem nenhum item visível", () => {
    const estrutura: NavEntry[] = [
      {
        label: "Secretaria",
        items: [{ href: "/x", label: "X", apenas: ["admin"] }],
      },
    ];
    expect(filtrarNav(estrutura, "servidor")).toEqual([]);
  });

  it("mantém o grupo quando pelo menos um item continua visível", () => {
    const estrutura: NavEntry[] = [
      {
        label: "Grupo",
        items: [
          { href: "/a", label: "A", apenas: ["admin"] },
          { href: "/b", label: "B" },
        ],
      },
    ];
    const resultado = filtrarNav(estrutura, "servidor");
    expect(resultado).toHaveLength(1);
    expect((resultado[0] as NavGroup).items.map((i) => i.href)).toEqual(["/b"]);
  });

  it("admin vê a estrutura completa de navegação real do sistema", () => {
    const resultado = filtrarNav(NAV_ESTRUTURA, "admin");
    expect(resultado).toEqual(NAV_ESTRUTURA);
  });

  it("servidor não vê Veículos, Pessoas nem Usuários/Auditoria", () => {
    const resultado = filtrarNav(NAV_ESTRUTURA, "servidor");
    const hrefs = resultado.flatMap((item) => ("items" in item ? item.items.map((i) => i.href) : [item.href]));
    expect(hrefs).not.toContain("/veiculos");
    expect(hrefs).not.toContain("/pessoas");
    expect(hrefs).not.toContain("/usuarios");
    expect(hrefs).not.toContain("/auditoria");
  });

  it("gestor_diarias vê Veículos mas não Pessoas/Avaliações/Usuários", () => {
    const resultado = filtrarNav(NAV_ESTRUTURA, "gestor_diarias");
    const hrefs = resultado.flatMap((item) => ("items" in item ? item.items.map((i) => i.href) : [item.href]));
    expect(hrefs).toContain("/veiculos");
    expect(hrefs).not.toContain("/pessoas");
    expect(hrefs).not.toContain("/avaliacoes");
    expect(hrefs).not.toContain("/usuarios");
  });

  it("sem papel (não autenticado) só vê itens sem nenhuma restrição", () => {
    const resultado = filtrarNav(NAV_ESTRUTURA, undefined);
    const hrefs = resultado.flatMap((item) => ("items" in item ? item.items.map((i) => i.href) : [item.href]));
    expect(hrefs).not.toContain("/usuarios");
    expect(hrefs).not.toContain("/auditoria");
    expect(hrefs).toContain("/dashboard");
  });
});
