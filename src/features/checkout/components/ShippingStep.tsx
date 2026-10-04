import { Truck } from "lucide-react";
import type { CartItemOut } from "@/api/types";
import { toUserMessage } from "@/api/errors";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
import { useCartShippingChoices } from "../shipping-queries";
import type { CartShippingChoice } from "../shipping-options";
import { StepCard } from "./StepCard";

interface ShippingStepProps {
  items: CartItemOut[];
  cep: string | null;
  locked: boolean;
  selectedCode: string | null;
  onSelect: (choice: CartShippingChoice | null) => void;
  choices: ReturnType<typeof useCartShippingChoices>;
}

export function ShippingStep({ cep, locked, selectedCode, onSelect, choices }: ShippingStepProps) {
  const { choices: options, isPending, isError, errors, refetch } = choices;

  return (
    <StepCard number={3} title="Envio" locked={locked} done={!locked && Boolean(selectedCode)}>
      {isPending ? (
        <div className="space-y-3" aria-busy="true" aria-label="Calculando o frete">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : isError ? (
        <div className="space-y-4">
          <Alert tone="error">
            {toUserMessage(errors[0], "Não foi possível calcular o frete para este CEP.")}
          </Alert>
          <Button variant="outline" size="sm" onClick={refetch}>
            Tentar novamente
          </Button>
        </div>
      ) : options.length === 0 ? (
        <Alert tone="info">
          Nenhuma transportadora atende o CEP {cep} para todos os itens do carrinho. Tente outro endereço.
        </Alert>
      ) : (
        <fieldset>
          <legend className="sr-only">Escolha a forma de envio</legend>
          <ul className="space-y-3">
            {options.map((option) => {
              const checked = option.code === selectedCode;
              return (
                <li key={option.code}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition-colors",
                      checked ? "border-oxblood-600 bg-oxblood-50/50" : "border-sand-200 hover:border-ink/30",
                    )}
                  >
                    <input
                      type="radio"
                      name="envio"
                      checked={checked}
                      onChange={() => onSelect(option)}
                      className="size-4 accent-oxblood-600"
                    />
                    <Truck className="size-5 shrink-0 text-ink-soft" aria-hidden="true" />
                    <span className="min-w-0 flex-1 text-sm">
                      <span className="block font-semibold text-ink">
                        {option.carrier} · {option.service}
                      </span>
                      <span className="block text-ink-soft">
                        Até {option.days} {option.days === 1 ? "dia útil" : "dias úteis"}
                      </span>
                    </span>
                    <span className="font-semibold text-oxblood-700">{formatBRL(option.priceCents / 100)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </fieldset>
      )}
    </StepCard>
  );
}