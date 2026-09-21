import type { ReactNode } from "react";
import { CircleAlert, CircleCheck, Info } from "lucide-react";
import { cn } from "@/lib/cn";

type AlertTone = "error" | "success" | "info";

const TONES: Record<AlertTone, { box: string; icon: ReactNode }> = {
  error: {
    box: "border-red-200 bg-red-50 text-red-800",
    icon: <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />,
  },
  success: {
    box: "border-olive-100 bg-olive-50 text-olive-800",
    icon: <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />,
  },
  info: {
    box: "border-gold-300 bg-gold-300/20 text-ink",
    icon: <Info className="mt-0.5 size-5 shrink-0" aria-hidden="true" />,
  },
};

export function Alert({
  tone = "info",
  children,
  className,
}: {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
}) {
  const { box, icon } = TONES[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("flex gap-3 rounded-md border px-4 py-3 text-sm", box, className)}
    >
      {icon}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
