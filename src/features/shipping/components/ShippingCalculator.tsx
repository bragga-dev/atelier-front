import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Truck } from "lucide-react";
import { useForm } from "react-hook-form";
import { toUserMessage } from "@/api/errors";
import { Button } from "@/components/ui/Button";
import { formatBRL } from "@/lib/format";
import { formatCep } from "@/lib/mask";
import { isShippingNotConfigured, useShippingQuote } from "../queries";
import { shippingQuoteSchema, type ShippingQuoteFormValues } from "../schemas";

/** Calculadora de frete da página do produto. Cota pela quantidade selecionada no momento do clique. */
export function ShippingCalculator({ productId, quantity }: { productId: string; quantity: number }) {
  const quote = useShippingQuote(productId, quantity);
  // Quantidade mudou depois da última cotação: o valor mostrado ficaria errado — some com ele.
  useEffect(() => {
    quote.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity]);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingQuoteFormValues>({ resolver: zodResolver(shippingQuoteSchema), defaultValues: { cep: "" } });

  const onSubmit = handleSubmit(({ cep }) => quote.mutate({ cep }));

  return (
    <div className="rounded-xl border border-sand-200 bg-white p-4">
      <form onSubmit={onSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <label htmlFor="frete-cep" className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Truck className="size-4 text-ink-soft" aria-hidden="true" />
            Calcular frete
          </label>
          <input
            id="frete-cep"
            inputMode="numeric"
            placeholder="00000-000"
            maxLength={9}
            aria-invalid={errors.cep ? true : undefined}
            aria-describedby={errors.cep ? "frete-cep-erro" : undefined}
            className="h-11 w-full rounded-xl border border-sand-200 bg-white px-4 text-base placeholder:text-ink-soft/50 hover:border-ink/30 focus-visible:border-navy-500"
            {...register("cep", {
              onChange: (event) => {
                event.target.value = formatCep(event.target.value);
              },
            })}
          />
        </div>
        <Button type="submit" variant="outline" loading={quote.isPending}>
          Calcular
        </Button>
      </form>

      {errors.cep && (
        <p id="frete-cep-erro" role="alert" className="mt-2 text-sm font-medium text-red-700">
          {errors.cep.message}
        </p>
      )}

      {quote.isError &&
        (isShippingNotConfigured(quote.error) ? (
          <p className="mt-3 text-sm text-ink-soft">O frete deste produto ainda não está disponível para cálculo.</p>
        ) : (
          <p role="alert" className="mt-3 text-sm text-oxblood-700">
            {toUserMessage(quote.error, "Não foi possível calcular o frete.")}
          </p>
        ))}

      {quote.isSuccess &&
        (quote.data.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">Nenhuma opção de frete para este CEP.</p>
        ) : (
          <ul className="mt-3 divide-y divide-sand-200 border-t border-sand-200">
            {quote.data.map((option, i) => (
              <li key={`${option.carrier}-${option.service}-${i}`} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span>
                  <span className="font-medium text-ink">
                    {option.carrier} · {option.service}
                  </span>
                  <span className="block text-ink-soft">
                    {option.delivery_time_days} {option.delivery_time_days === 1 ? "dia útil" : "dias úteis"}
                  </span>
                </span>
                <span className="font-semibold text-oxblood-700">{formatBRL(option.price)}</span>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}