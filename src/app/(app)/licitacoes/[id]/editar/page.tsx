import { notFound, redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { buscarProcesso, listarFichasAtivas, listarPessoasAtivas } from "../../actions";
import { EditarProcessoClient } from "./editar-processo-client";

export default async function EditarProcessoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const usuario = await getCurrentUsuario();
  if (!usuario || !["admin", "ordenador_despesa", "servidor"].includes(usuario.papel)) {
    redirect("/dashboard");
  }

  const [processo, fichas, pessoas] = await Promise.all([
    buscarProcesso(id),
    listarFichasAtivas(),
    listarPessoasAtivas(),
  ]);
  if (!processo) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Editar processo</h1>
      <div className="mt-6 max-w-3xl">
        <EditarProcessoClient processo={processo} fichas={fichas} pessoas={pessoas} />
      </div>
    </div>
  );
}
