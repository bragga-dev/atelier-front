import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/cn";

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max: number;
  disabled?: boolean;
  className?: string;
}

const STEP_BUTTON =
  "grid size-11 shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-espresso/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

/** Estepe de quantidade sempre travado entre `min` e `max` (o estoque do produto). */
export function QuantitySelector({ value, onChange, min = 1, max, disabled, className }: QuantitySelectorProps) {
  const clamp = (next: number) => onChange(Math.min(max, Math.max(min, next)));

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border border-sand-200 bg-white",
        disabled && "opacity-50",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => clamp(value - 1)}
        disabled={disabled || value <= min}
        aria-label="Diminuir quantidade"
        className={STEP_BUTTON}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>

      <input
        type="number"
        inputMode="numeric"
        role="spinbutton"
        aria-label="Quantidade"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          if (Number.isFinite(parsed)) clamp(parsed);
        }}
        className="h-11 w-12 border-0 bg-transparent text-center text-base font-semibold text-ink [appearance:textfield] focus-visible:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        type="button"
        onClick={() => clamp(value + 1)}
        disabled={disabled || value >= max}
        aria-label="Aumentar quantidade"
        className={STEP_BUTTON}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}