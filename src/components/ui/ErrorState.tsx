import { CloudOff } from "lucide-react";
import { toUserMessage } from "@/api/errors";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

interface ErrorStateProps {
  /** Erro capturado (a mensagem amigável é derivada dele). */
  error?: unknown;
  title?: string;
  message?: string;
  onRetry?: () => void;
  retrying?: boolean;
  className?: string;
}

export function ErrorState({
  error,
  title = "Não conseguimos carregar isso",
  message,
  onRetry,
  retrying,
  className,
}: ErrorStateProps) {
  return (
    <div role="alert" className={cn("mx-auto max-w-md px-4 py-12 text-center", className)}>
      <div className="mx-auto grid size-14 place-items-center rounded-full bg-oxblood-50 text-oxblood-600">
        <CloudOff className="size-7" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-ink-soft">{message ?? toUserMessage(error)}</p>
      {onRetry && (
        <Button className="mt-6" variant="outline" onClick={onRetry} loading={retrying}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
