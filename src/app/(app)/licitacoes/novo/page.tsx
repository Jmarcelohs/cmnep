import { redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { listarFichasAtivas, listarPessoasAtivas } from "../actions";
import { NovoProcessoClient } from "./novo-processo-client";

export default async function NovoProcessoPage() {
  const usuario = await getCurrentUsuario();
  if (!usuario || !["admin", "ordenador_despesa", "servidor"].includes(usuario.papel)) {
    redirect("/dashboard");
  }

  const [fichas, pessoas] = await Promise.all([listarFichasAtivas(), listarPessoasAtivas()]);

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Novo processo</h1>
      <p className="mt-1 text-sm text-slate-500">
        Registro central do processo — os documentos (capa, DFD, ETP...) são gerados a partir dele.
      </p>
      <div className="mt-6 max-w-3xl">
        <NovoProcessoClient fichas={fichas} pessoas={pessoas} />
      </div>
    </div>
  );
}
