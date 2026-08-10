import { notFound, redirect } from "next/navigation";
import { getCurrentUsuario } from "@/lib/auth/get-current-usuario";
import { buscarEvento } from "@/lib/agenda/google-calendar";
import { editarEvento } from "../../actions";
import { EventoForm } from "../../evento-form";

export default async function EditarEventoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const usuario = await getCurrentUsuario();
  if (!usuario) redirect("/login");

  const evento = await buscarEvento(id);
  if (!evento) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold text-brand-navy">Editar compromisso</h1>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <EventoForm
        action={editarEvento.bind(null, id)}
        submitLabel="Salvar alterações"
        valoresIniciais={{
          titulo: evento.titulo,
          descricao: evento.descricao ?? "",
          local: evento.local ?? "",
          diaTodo: evento.diaTodo,
          // datetime-local espera "YYYY-MM-DDTHH:mm" — a API devolve com
          // segundos e offset (ex.: "2026-08-20T14:00:00-03:00");
          // eventos de dia inteiro já vêm só como "YYYY-MM-DD".
          inicio: evento.diaTodo ? evento.inicio : evento.inicio.slice(0, 16),
          fim: evento.diaTodo ? evento.fim : evento.fim.slice(0, 16),
        }}
      />
    </div>
  );
}
