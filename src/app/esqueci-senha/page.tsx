import Image from "next/image";
import Link from "next/link";
import { enviarRecuperacaoSenha } from "./actions";
import { BotaoSuporteWhatsapp } from "@/components/botao-suporte-whatsapp";

export default async function EsqueciSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ enviado?: string }>;
}) {
  const { enviado } = await searchParams;

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
          <h1 className="mt-4 text-lg font-semibold text-brand-navy">Esqueci minha senha</h1>
          <p className="mt-1 text-sm text-slate-500">
            Informe seu e-mail institucional e enviaremos um link pra redefinir sua senha.
          </p>

          {enviado ? (
            <p className="mt-6 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Se esse e-mail estiver cadastrado, enviamos um link de redefinição. Confira sua
              caixa de entrada (e o spam).
            </p>
          ) : (
            <form action={enviarRecuperacaoSenha} className="mt-6 space-y-4">
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
              <button
                type="submit"
                className="w-full rounded-md bg-brand-navy px-3 py-2 text-sm font-medium text-white hover:bg-brand-navy-light"
              >
                Enviar link de redefinição
              </button>
            </form>
          )}

          <Link
            href="/login"
            className="mt-6 block text-center text-sm text-brand-navy hover:underline"
          >
            Voltar para o login
          </Link>
        </div>
      </main>

      <BotaoSuporteWhatsapp />
    </div>
  );
}
