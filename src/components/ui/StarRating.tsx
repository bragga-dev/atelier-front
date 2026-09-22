import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

interface StarRatingProps {
  /** Média de 0 a 5 (aceita decimal — é arredondada para a estrela mais próxima). */
  value: number;
  size?: "sm" | "md";
  className?: string;
}

const SIZE = { sm: "size-4", md: "size-5" } as const;

export function StarRating({ value, size = "sm", className }: StarRatingProps) {
  const rounded = Math.round(Math.min(5, Math.max(0, value)));

  return (
    <span
      role="img"
      aria-label={`${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} de 5 estrelas`}
      className={cn("inline-flex items-center gap-0.5", className)}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden="true"
          className={cn(SIZE[size], i < rounded ? "fill-gold-400 text-gold-500" : "fill-transparent text-sand-200")}
        />
      ))}
    </span>
  );
}