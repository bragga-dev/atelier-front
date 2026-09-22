import { useRef, useState } from "react";
import type { ProductImageOut } from "@/api/types";
import { cn } from "@/lib/cn";
import { ProductImage } from "./ProductImage";

/** Capa primeiro, depois pela ordem definida no admin. */
function sortImages(images: ProductImageOut[]): ProductImageOut[] {
  return [...images].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.display_order - b.display_order);
}

export function ProductGallery({ images, productName }: { images: ProductImageOut[]; productName: string }) {
  const sorted = sortImages(images);
  const [index, setIndex] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const current = sorted[index];

  const select = (target: number) => {
    setIndex(target);
    const thumb = thumbsRef.current?.children[target] as HTMLElement | undefined;
    thumb?.focus();
  };

  const onThumbsKeyDown = (event: React.KeyboardEvent) => {
    if (sorted.length < 2) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      select((index + 1) % sorted.length);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      select((index - 1 + sorted.length) % sorted.length);
    }
  };

  return (
    <div>
      <div className="aspect-square overflow-hidden rounded-[var(--radius-card)] bg-sand">
        <ProductImage
          src={current?.product_image_url}
          alt={productName}
          priority
          className="size-full"
        />
      </div>

      {sorted.length > 1 && (
        <div
          ref={thumbsRef}
          role="tablist"
          aria-label="Fotos do produto"
          onKeyDown={onThumbsKeyDown}
          className="mt-3 flex gap-2 overflow-x-auto pb-1"
        >
          {sorted.map((image, i) => (
            <button
              key={image.image_id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Foto ${i + 1} de ${sorted.length}`}
              tabIndex={i === index ? 0 : -1}
              onClick={() => select(i)}
              className={cn(
                "size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors",
                i === index ? "border-oxblood-600" : "border-transparent hover:border-sand-200",
              )}
            >
              <ProductImage src={image.product_image_url} alt="" className="size-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}