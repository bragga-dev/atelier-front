import { useState } from "react";
import { CircleAlert, ShoppingCart } from "lucide-react";
import { Link } from "react-router";
import type { ProductOut } from "@/api/types";
import { Button } from "@/components/ui/Button";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { useAddToCart } from "@/features/cart/mutations";
import { useAuth } from "@/features/auth/auth-context";
import { ShippingCalculator } from "@/features/shipping/components/ShippingCalculator";
import { formatBRL } from "@/lib/format";
import { productPath } from "@/lib/slug";

export function BuyBox({ product }: { product: ProductOut }) {
  const { status, isAuthenticated, me } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const addToCart = useAddToCart();

  const outOfStock = !product.in_stock || product.stock <= 0;
  // O carrinho é um recurso do cliente (mesma regra do header/badge) — contas administrativas não compram.
  const isClientAccount = me?.user.role === "client";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-3xl font-semibold text-oxblood-700">{formatBRL(product.price)}</p>
        {outOfStock ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-ink-soft">
            <CircleAlert className="size-4" aria-hidden="true" />
            Produto esgotado no momento
          </p>
        ) : product.stock <= 5 ? (
          <p className="mt-1 text-sm font-medium text-oxblood-600">Últimas {product.stock} unidades</p>
        ) : null}
      </div>

      {!outOfStock && (
        <div className="flex flex-wrap items-center gap-4">
          <QuantitySelector value={quantity} onChange={setQuantity} max={product.stock} disabled={!isClientAccount && isAuthenticated} />

          {status === "loading" ? null : !isAuthenticated ? (
            <Link to={`/entrar?next=${encodeURIComponent(productPath(product))}`} className="flex-1">
              <Button size="lg" fullWidth>
                Entrar para comprar
              </Button>
            </Link>
          ) : isClientAccount ? (
            <Button
              size="lg"
              className="flex-1"
              loading={addToCart.isPending}
              onClick={() => addToCart.mutate({ product_id: product.product_id, quantity_item: quantity })}
            >
              <ShoppingCart className="size-5" aria-hidden="true" />
              Adicionar ao carrinho
            </Button>
          ) : (
            <p className="text-sm text-ink-soft">Esta conta é administrativa e não faz compras na loja.</p>
          )}
        </div>
      )}

      <ShippingCalculator productId={product.product_id} quantity={quantity} />
    </div>
  );
}