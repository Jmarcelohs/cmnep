export function CampoBusca({
  defaultValue,
  placeholder = "Buscar",
  label = "Busca",
  id = "busca",
}: {
  defaultValue?: string;
  placeholder?: string;
  label?: string;
  // Só precisa mudar quando dois CampoBusca aparecem na mesma página (ex.:
  // o da sidebar global e o da própria tela de busca) — HTML não aceita
  // dois elementos com o mesmo id.
  id?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-slate-500">{label}</label>
      <input
        id={id}
        type="text"
        name="busca"
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      />
    </div>
  );
}
