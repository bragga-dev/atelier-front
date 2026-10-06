import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

/** Seletor de nota 1–5 acessível (grupo de radio com setas do teclado nativas). */
export function StarPicker({ value, onChange, name }: { value: number; onChange: (value: number) => void; name: string }) {
  return (
    <fieldset>
      <legend className="sr-only">Nota de 1 a 5 estrelas</legend>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer">
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="peer sr-only" />
            <Star
              aria-hidden="true"
              className={cn("size-8 transition-colors peer-focus-visible:outline peer-focus-visible:outline-2", n <= value ? "fill-gold-400 text-gold-500" : "fill-transparent text-sand-200 hover:text-gold-400")}
            />
            <span className="sr-only">{n} {n === 1 ? "estrela" : "estrelas"}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}