import { Select } from "@/components/ui/select";
import { PAGE_SIZE_OPTIONS } from "@/lib/constants";

export function PageSizeSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-muted" htmlFor="page-size">
        Itens por página
      </label>
      <Select
        className="w-16"
        id="page-size"
        onChange={(event) => onChange(Number(event.target.value))}
        value={value}
      >
        {PAGE_SIZE_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
    </div>
  );
}
