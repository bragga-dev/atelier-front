import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { toast, useToasts, type ToastKind } from "@/lib/toast";
import { cn } from "@/lib/cn";

const STYLES: Record<ToastKind, string> = {
  success: "border-olive-600 bg-olive-50 text-olive-800",
  error: "border-red-600 bg-red-50 text-red-800",
  info: "border-gold-500 bg-white text-ink",
};

const ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
} as const;

/** Região aria-live: leitores de tela anunciam os avisos sem roubar o foco. */
export function ToastViewport() {
  const items = useToasts();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end"
    >
      {items.map((item) => {
        const Icon = ICONS[item.kind];
        return (
          <div
            key={item.id}
            role={item.kind === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-md border-l-4 p-4 shadow-card",
              STYLES[item.kind],
            )}
          >
            <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
            <p className="flex-1 text-sm font-medium">{item.message}</p>
            <button
              type="button"
              onClick={() => toast.dismiss(item.id)}
              aria-label="Fechar aviso"
              className="-m-1 rounded p-1 opacity-70 hover:opacity-100"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
