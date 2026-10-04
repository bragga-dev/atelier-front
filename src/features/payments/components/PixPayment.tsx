import { Check, Copy } from "lucide-react";
import { useState } from "react";
import type { PaymentOut } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { copyToClipboard } from "@/lib/clipboard";
import { safeExternalUrl } from "@/lib/safe-url";

export function PixPayment({ payment }: { payment: PaymentOut }) {
  const [copied, setCopied] = useState(false);
  const invoiceUrl = safeExternalUrl(payment.invoice_url);

  const copy = async () => {
    if (!payment.pix_copy_paste) return;
    const ok = await copyToClipboard(payment.pix_copy_paste);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 3000);
    }
  };

  if (!payment.pix_qr_code) {
    return (
      <div className="text-center">
        <p className="text-ink-soft">
          Estamos gerando o QR Code do Pix. Se ele não aparecer em alguns instantes, use o link abaixo.
        </p>
        {invoiceUrl && (
          <a href={invoiceUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block font-semibold text-oxblood-700 underline">
            Abrir cobrança
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="text-center">
      <img
        src={`data:image/png;base64,${payment.pix_qr_code}`}
        alt="QR Code para pagamento via Pix"
        className="mx-auto size-56 rounded-xl border border-sand-200 p-2"
      />
      {payment.pix_copy_paste && (
        <div className="mx-auto mt-5 max-w-sm">
          <p className="text-sm font-semibold">Ou copie o código</p>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-sand-200 bg-parchment/40 p-2 pl-4">
            <span className="min-w-0 flex-1 truncate text-left text-xs text-ink-soft">{payment.pix_copy_paste}</span>
            <Button type="button" variant="outline" size="sm" onClick={() => void copy()}>
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}