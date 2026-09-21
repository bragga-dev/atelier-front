import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
}

/** Imagem de produto com fallback (produto sem foto ou imagem que falhou ao carregar). */
export function ProductImage({ src, alt, className, priority = false }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div role="img" aria-label={`${alt} (sem foto)`} className={cn("grid place-items-center bg-sand text-ink-soft/50", className)}>
        <ImageOff className="size-10" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}