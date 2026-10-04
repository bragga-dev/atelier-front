import { FileText } from "lucide-react";
import type { PaymentOut } from "@/api/types";
import { buttonStyles } from "@/components/ui/button-styles";
import { formatDateOnly } from "@/lib/format";
import { safeExternalUrl } from "@/lib/safe-url";

export function BoletoPayment({ payment }: { payment: PaymentOut }) {
  const boletoUrl = safeExternalUrl(payment.bank_slip_url) ?? safeExternalUrl(payment.invoice_url);

  return (
    <div className="text-center">
      <span className="mx-auto grid size-14 place-items-center rounded-full bg-parchment text-oxblood-600">
        <FileText className="size-7" aria-hidden="true" />
      </span>
      <p className="mt-4 text-ink-soft">
        Vencimento em <strong className="text-ink">{formatDateOnly(payment.due_date)}</strong>. O pagamento pode levar até 3
        dias úteis para ser confirmado.
      </p>
      {boletoUrl ? (
        <a href={boletoUrl} target="_blank" rel="noopener noreferrer" className={`${buttonStyles({ size: "lg" })} mt-5 inline-flex`}>
          Ver boleto
        </a>
      ) : (
        <p className="mt-5 text-sm text-ink-soft">O link do boleto está sendo gerado — atualize esta página em instantes.</p>
      )}
    </div>
  );
}