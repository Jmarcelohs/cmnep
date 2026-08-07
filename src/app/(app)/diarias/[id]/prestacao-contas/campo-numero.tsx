export function CampoNumero({
  name,
  label,
  defaultValue = 0,
}: {
  name: string;
  label: string;
  defaultValue?: number;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-xs font-medium text-slate-500">{label}</label>
      <input
        id={name}
        type="number"
        step="0.01"
        min={0}
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900"
      />
    </div>
  );
}
