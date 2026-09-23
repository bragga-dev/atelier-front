import type { AddressOut } from "@/api/types";
import { cn } from "@/lib/cn";

export function AddressCard({ address, selected, onSelect }: { address: AddressOut; selected: boolean; onSelect: () => void }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-md border p-4 transition-colors",
        selected ? "border-oxblood-700 bg-oxblood-50/40" : "border-sand-200 hover:border-ink/30",
      )}
    >
      <input
        type="radio"
        name="shipping-address"
        checked={selected}
        onChange={onSelect}
        className="mt-1 size-4 accent-oxblood-700"
      />
      <span className="text-sm">
        <span className="block font-semibold text-ink">
          {address.street}, {address.number}
          {address.complement && ` — ${address.complement}`}
        </span>
        <span className="block text-ink-soft">
          {address.neighborhood}, {address.city} - {address.state} · CEP {address.cep}
        </span>
        {address.is_preferential && (
          <span className="mt-1 inline-block rounded bg-gold-300/30 px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-gold-600">
            Preferencial
          </span>
        )}
      </span>
    </label>
  );
}