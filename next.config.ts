import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // O Chromium completo do pacote "puppeteer" (uso local, ~300MB) não pode
  // entrar no bundle da function serverless da Vercel — lá usamos
  // @sparticuz/chromium (ver src/app/api/diarias/[id]/pdf/route.ts).
  outputFileTracingExcludes: {
    "/api/diarias/[id]/pdf": ["node_modules/puppeteer/**"],
  },
  // sharp tem um binário nativo por plataforma — sem isso, o rastreamento
  // de arquivos do Next.js tenta empacotar o binário errado (o instalado
  // localmente no Windows) no lugar do linux-x64 que a function
  // serverless da Vercel precisa em tempo de execução (ver
  // lib/mocoes/gerar-docx.ts, usado pela rota /api/mocoes/[id]/docx).
  serverExternalPackages: ["sharp"],
  // Agenda, Mensagens e Licitações estão desativadas: nenhuma rota (página,
  // impressão ou API) abre mais — tudo volta para o Painel. Código e dados
  // seguem guardados; para reativar, remova estes redirects e devolva os
  // itens em src/lib/nav.ts.
  async redirects() {
    return ["agenda", "mensagens", "licitacoes"].flatMap((modulo) => [
      { source: `/${modulo}`, destination: "/dashboard", permanent: false },
      { source: `/${modulo}/:path*`, destination: "/dashboard", permanent: false },
    ]).concat([
      { source: "/api/licitacoes/:path*", destination: "/dashboard", permanent: false },
    ]);
  },
};

export default nextConfig;
