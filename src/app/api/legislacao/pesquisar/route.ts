import { NextRequest, NextResponse } from "next/server";

// A legislação de Nepomuceno é mantida pelo leis.org (leismunicipais.com.br),
// fora do nosso sistema — não temos acesso à busca interna deles (site
// bloqueado por proteção anti-bot pra acesso automatizado), então a busca
// por termo usa o Google restrito ao site deles (`site:`), que é confiável
// e não depende de conhecer a estrutura interna da busca alheia.
const SITE_LEGISLACAO = "leis.org/camara/mg/nepomuceno";

export async function GET(request: NextRequest) {
  const termo = request.nextUrl.searchParams.get("termo")?.trim();

  if (!termo) {
    return NextResponse.redirect(`https://${SITE_LEGISLACAO}`);
  }

  const query = `site:${SITE_LEGISLACAO} ${termo}`;
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  return NextResponse.redirect(url);
}
