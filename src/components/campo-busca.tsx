export function CampoBusca({
  defaultValue,
  placeholder = "Buscar",
  label = "Busca",
}: {
  defaultValue?: string;
  placeholder?: string;
  label?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-500">{label}</label>
      <input
        type="text"
        name="busca"
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="mt-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
      />
    </div>
  );
}
