import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { isApiError, toUserMessage } from "@/api/errors";
import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/button-styles";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/features/auth/auth-context";
import { useCart, useCartEnabled } from "@/features/cart/queries";
import { AddressStep } from "@/features/checkout/components/AddressStep";
import { CheckoutSummary } from "@/features/checkout/components/CheckoutSummary";
import { isProfileComplete, ProfileStep } from "@/features/checkout/components/ProfileStep";
import { ShippingStep } from "@/features/checkout/components/ShippingStep";
import { useCreateOrder } from "@/features/checkout/mutations";
import { useAddresses } from "@/features/checkout/queries";
import { useCartShippingChoices } from "@/features/checkout/shipping-queries";

export default function CheckoutPage() {
  const { me } = useAuth();
  const navigate = useNavigate();
  const isClientAccount = useCartEnabled();
  const cart = useCart();
  const addresses = useAddresses();
  const createOrder = useCreateOrder();

  const [pickedAddressId, setPickedAddressId] = useState<string | null>(null);
  const [pickedServiceCode, setPickedServiceCode] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<unknown>(null);

  const profileComplete = isProfileComplete(me?.client);
  const addressList = addresses.data ?? [];
  // Se a pessoa não escolheu, vale o endereço preferencial (o backend marca o último cadastrado).
  const selectedAddress =
    addressList.find((address) => address.address_id === pickedAddressId) ??
    addressList.find((address) => address.is_preferential) ??
    addressList[0] ??
    null;

  const addressStepLocked = !profileComplete;
  const shippingStepLocked = addressStepLocked || !selectedAddress;

  const items = cart.data?.items ?? [];
  const shippingChoices = useCartShippingChoices(items, shippingStepLocked ? null : selectedAddress?.cep ?? null);
  // A opção só vale se ainda existir para o endereço atual (trocar de endereço pode mudar as opções).
  const selectedShipping = shippingChoices.choices.find((choice) => choice.code === pickedServiceCode) ?? null;

  if (!isClientAccount) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<ShoppingBag className="size-7" aria-hidden="true" />}
          title="Sem checkout por aqui"
          description="Contas administrativas não fazem compras na loja."
        />
      </Container>
    );
  }

  if (cart.isPending) {
    return (
      <Container className="py-8 sm:py-12">
        <Skeleton className="mb-8 h-12 w-64" />
        <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
          <div className="space-y-4">
            <Skeleton className="h-40 rounded-[var(--radius-card)]" />
            <Skeleton className="h-40 rounded-[var(--radius-card)]" />
          </div>
          <Skeleton className="h-96 rounded-[var(--radius-card)]" />
        </div>
      </Container>
    );
  }

  if (cart.isError) {
    return (
      <Container className="py-16">
        <ErrorState error={cart.error} onRetry={() => void cart.refetch()} retrying={cart.isFetching} />
      </Container>
    );
  }

  if (!cart.data || cart.data.items.length === 0) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<ShoppingBag className="size-7" aria-hidden="true" />}
          title="Seu carrinho está vazio"
          description="Adicione produtos antes de finalizar a compra."
          action={
            <Link to="/produtos" className={buttonStyles()}>
              Ver produtos
            </Link>
          }
        />
      </Container>
    );
  }

  const canSubmit = profileComplete && Boolean(selectedAddress) && Boolean(selectedShipping);

  const handleSubmit = async () => {
    if (!selectedAddress || !selectedShipping) return;
    setSubmitError(null);
    try {
      const order = await createOrder.mutateAsync({
        shipping_address_id: selectedAddress.address_id,
        shipping_service_code: selectedShipping.code,
      });
      // `replace`: o carrinho foi esvaziado, então "voltar" não deve cair num checkout vazio.
      navigate(`/painel/meus-pedidos/${order.order_id}/pagamento`, { replace: true });
    } catch (error) {
      setSubmitError(error);
    }
  };

  const submitErrorNode = submitError ? (
    <>
      <p>{toUserMessage(submitError, "Não foi possível criar o pedido. Tente novamente.")}</p>
      {isApiError(submitError) && submitError.status === 409 && (
        <Link to="/carrinho" className="mt-1 inline-block font-semibold underline">
          Revisar o carrinho
        </Link>
      )}
    </>
  ) : null;

  return (
    <Container className="py-8 sm:py-12">
      <h1 className="mb-8 text-4xl font-semibold sm:text-5xl">Finalizar compra</h1>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-4">
          <ProfileStep client={me?.client} />
          <AddressStep
            locked={addressStepLocked}
            selectedId={selectedAddress?.address_id ?? null}
            onSelect={(address) => {
              setPickedAddressId(address.address_id);
              setPickedServiceCode(null);
            }}
          />
          <ShippingStep
            items={items}
            cep={selectedAddress?.cep ?? null}
            locked={shippingStepLocked}
            selectedCode={selectedShipping?.code ?? null}
            onSelect={(choice) => setPickedServiceCode(choice?.code ?? null)}
            choices={shippingChoices}
          />
        </div>

        <div className="lg:sticky lg:top-24">
          <CheckoutSummary
            cart={cart.data}
            shipping={selectedShipping}
            canSubmit={canSubmit}
            submitting={createOrder.isPending}
            onSubmit={() => void handleSubmit()}
            error={submitErrorNode}
          />
        </div>
      </div>
    </Container>
  );
}