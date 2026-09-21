import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "gold" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold uppercase tracking-[0.08em] " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-60 select-none whitespace-nowrap";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-oxblood-600 text-cream hover:bg-oxblood-700",
  secondary: "bg-espresso text-cream hover:bg-ink-soft",
  gold: "bg-gold-400 text-ink hover:bg-gold-500",
  outline: "border border-ink/30 bg-transparent text-ink hover:border-oxblood-600 hover:text-oxblood-700",
  ghost: "text-ink hover:bg-espresso/5",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-xs",
  md: "h-11 px-6 text-[0.8125rem]",
  lg: "h-12 px-8 text-sm",
};

interface ButtonStyleOptions {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
}

/** Classes de botão reutilizáveis também em <Link>: `<Link className={buttonStyles({...})}>`. */
export function buttonStyles({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className,
}: ButtonStyleOptions = {}): string {
  return cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className);
}