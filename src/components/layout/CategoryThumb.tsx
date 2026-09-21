import { useState } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/cn";

/** Miniatura redonda da categoria, com fallback caso a imagem não carregue. */
export function CategoryThumb({ src, className }: { src: string | null | undefined; className?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className={cn("grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-sand", className)}>
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <Sparkles className="size-5 text-gold-500" aria-hidden="true" />
      )}
    </span>
  );
}
