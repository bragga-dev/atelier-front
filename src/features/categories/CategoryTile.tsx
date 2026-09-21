import { useState } from "react";
import { Link } from "react-router";
import type { CategoryOut } from "@/api/types";

/** Cartão de categoria: imagem com nome sobreposto. Leva ao catálogo já filtrado. */
export function CategoryTile({ category }: { category: CategoryOut }) {
  const [failed, setFailed] = useState(false);

  return (
    <li>
      <Link
        to={`/produtos?categoria=${category.product_category_id}`}
        className="group relative block aspect-[4/3] overflow-hidden rounded-md bg-parchment"
      >
        {category.category_image_url && !failed && (
          <img
            src={category.category_image_url}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-espresso/75 via-espresso/10 to-transparent" aria-hidden="true" />
        <span className="absolute inset-x-0 bottom-0 p-4 font-display text-2xl font-semibold leading-tight text-cream">
          {category.category_name}
        </span>
      </Link>
    </li>
  );
}