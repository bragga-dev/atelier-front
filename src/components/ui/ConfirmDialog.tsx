import { useRef, type ReactNode } from "react";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { Button } from "./Button";
import type { ButtonVariant } from "./button-styles";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  /** Conteúdo extra entre a descrição e os botões (ex.: campo de motivo). */
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: ButtonVariant;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Diálogo de confirmação para ações destrutivas (esvaziar carrinho, cancelar pedido…). */
export function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmVariant = "primary",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(open, panelRef);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center p-4"
      onKeyDown={(event) => {
        if (event.key === "Escape" && !loading) onCancel();
      }}
    >
      <div className="absolute inset-0 bg-ink/50" aria-hidden="true" onClick={() => !loading && onCancel()} />

      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby={description ? "confirm-dialog-description" : undefined}
        className="relative w-full max-w-sm rounded-[var(--radius-card)] bg-white p-6 shadow-card"
      >
        <h2 id="confirm-dialog-title" className="text-2xl font-semibold">
          {title}
        </h2>
        {description && (
          <p id="confirm-dialog-description" className="mt-2 text-ink-soft">
            {description}
          </p>
        )}
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}