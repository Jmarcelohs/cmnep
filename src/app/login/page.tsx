import Image from "next/image";
import Link from "next/link";
import { signIn } from "./actions";
import { BotaoSuporteWhatsapp } from "@/components/botao-suporte-whatsapp";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; redirect?: string }>;
}) {
  const { error, redirect: redirectTo } = await searchParams;

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
          <h1 className="mt-4 text-lg font-semibold text-brand-navy">Entrar</h1>
          <p className="mt-1 text-sm text-slate-500">
            Entre com seu e-mail institucional.
          </p>

          {error && (
            <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <form action={signIn} className="mt-6 space-y-4">
            <input type="hidden" name="redirectTo" value={redirectTo ?? "/dashboard"} />
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-2 focus:outline-brand-navy focus:outline-offset-1"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-navy focus:outline-2 focus:outline-brand-navy focus:outline-offset-1"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
            >
              Entrar
            </button>
          </form>

          <Link
            href="/esqueci-senha"
            className="mt-4 block text-center text-sm text-brand-navy hover:underline"
          >
            Esqueci minha senha
          </Link>
        </div>
      </main>

      <BotaoSuporteWhatsapp />
    </div>
  );
}
