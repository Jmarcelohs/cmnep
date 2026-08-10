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
};

export default nextConfig;
