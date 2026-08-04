import Image from "next/image";
import { atualizarSenha } from "./actions";
import { BotaoSuporteWhatsapp } from "@/components/botao-suporte-whatsapp";

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <div className="h-1.5 bg-gradient-to-r from-brand-green to-brand-navy" />
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <Image
            src="/timbrado/logo.png"
            alt="Câmara Municipal de Nepomuceno"
            width={690}
            height={300}
            priority
            className="h-12 w-auto"
          />
          <h1 className="mt-4 text-lg font-semibold text-brand-navy">Redefinir senha</h1>
          <p className="mt-1 text-sm text-slate-500">Escolha uma nova senha.</p>

          {error && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <form action={atualizarSenha} className="mt-6 space-y-4">
            <div>
              <label htmlFor="senha" className="block text-sm font-medium text-slate-700">
                Nova senha
              </label>
              <input
                id="senha"
                name="senha"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-2 focus:outline-brand-navy focus:outline-offset-1"
              />
            </div>
            <div>
              <label htmlFor="confirmarSenha" className="block text-sm font-medium text-slate-700">
                Confirmar nova senha
              </label>
              <input
                id="confirmarSenha"
                name="confirmarSenha"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-2 focus:outline-brand-navy focus:outline-offset-1"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
            >
              Salvar nova senha
            </button>
          </form>
        </div>
      </main>

      <BotaoSuporteWhatsapp />
    </div>
  );
}
