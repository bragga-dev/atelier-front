import { CreditCard, FileText, QrCode, type LucideIcon } from "lucide-react";
import type { PaymentBillingType } from "@/api/types";
import { cn } from "@/lib/cn";
import { BILLING_TYPE_LABEL } from "@/features/orders/status";

const METHODS: { value: PaymentBillingType; icon: LucideIcon; hint: string }[] = [
  { value: "PIX", icon: QrCode, hint: "Aprovação na hora" },
  { value: "CREDIT_CARD", icon: CreditCard, hint: "Pagamento à vista" },
  { value: "BOLETO", icon: FileText, hint: "Compensa em até 3 dias úteis" },
];

interface PaymentMethodPickerProps {
  value: PaymentBillingType;
  onChange: (value: PaymentBillingType) => void;
  disabled?: boolean;
}

export function PaymentMethodPicker({ value, onChange, disabled }: PaymentMethodPickerProps) {
  return (
    <fieldset disabled={disabled}>
      <legend className="sr-only">Forma de pagamento</legend>
      <ul className="grid gap-3 sm:grid-cols-3">
        {METHODS.map(({ value: method, icon: Icon, hint }) => {
          const checked = method === value;
          return (
            <li key={method}>
              <label
                className={cn(
                  "flex h-full cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors",
                  checked ? "border-oxblood-600 bg-oxblood-50/50" : "border-sand-200 hover:border-ink/30",
                  disabled && "cursor-not-allowed opacity-60",
                )}
              >
                <input
                  type="radio"
                  name="forma-pagamento"
                  value={method}
                  checked={checked}
                  onChange={() => onChange(method)}
                  className="sr-only"
                />
                <Icon className={cn("size-7", checked ? "text-oxblood-600" : "text-ink-soft")} aria-hidden="true" />
                <span className="font-semibold">{BILLING_TYPE_LABEL[method]}</span>
                <span className="text-xs text-ink-soft">{hint}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}