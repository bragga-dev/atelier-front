import { useState } from "react";
import { CircleCheck, PackageX } from "lucide-react";
import { Link, useParams } from "react-router";
import { isApiError } from "@/api/errors";
import { paymentErrorMessage } from "@/features/payments/error-message";
import type { PaymentBillingType, PaymentCreateIn } from "@/api/types";
import { Container } from "@/components/layout/Container";
import { Alert } from "@/components/ui/Alert";
import { buttonStyles } from "@/components/ui/button-styles";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCartEnabled } from "@/features/cart/queries";
import { useOrder, useOrderPayments } from "@/features/orders/queries";
import { useCreatePayment } from "@/features/orders/mutations";
import { Button } from "@/components/ui/Button";
import { OrderSummaryCard } from "@/features/orders/components/OrderSummaryCard";
import { OrderStatusBadge, PaymentStatusBadge } from "@/features/orders/components/StatusBadges";
import { isOpenPayment, isPaidPayment } from "@/features/orders/status";
import { CardPaymentForm } from "@/features/payments/components/CardPaymentForm";
import { PaymentMethodPicker } from "@/features/payments/components/PaymentMethodPicker";
import { PixPayment } from "@/features/payments/components/PixPayment";
import { BoletoPayment } from "@/features/payments/components/BoletoPayment";
import { useAuth } from "@/features/auth/auth-context";
import { useAddresses } from "@/features/checkout/queries";
import { formatBRL } from "@/lib/format";

export default function OrderPaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { me } = useAuth();
  const isClientAccount = useCartEnabled();
  const [method, setMethod] = useState<PaymentBillingType>("PIX");
  const [createError, setCreateError] = useState<unknown>(null);

  const order = useOrder(orderId ?? "", { poll: true });
  const payments = useOrderPayments(orderId ?? "", { poll: true });
  const addresses = useAddresses();
  const createPayment = useCreatePayment(orderId ?? "");

  if (!isClientAccount) {
    return (
      <Container className="py-16">
        <EmptyState icon={<PackageX className="size-7" aria-hidden="true" />} title="Sem pagamento por aqui" description="Contas administrativas não fazem compras na loja." />
      </Container>
    );
  }

  if (order.isPending || payments.isPending) {
    return (
      <Container className="py-8 sm:py-12">
        <Skeleton className="mb-8 h-12 w-64" />
        <div className="grid gap-8 lg:grid-cols-[1fr_24rem]">
          <Skeleton className="h-80 rounded-[var(--radius-card)]" />
          <Skeleton className="h-80 rounded-[var(--radius-card)]" />
        </div>
      </Container>
    );
  }

  if (order.isError) {
    if (isApiError(order.error) && order.error.status === 404) {
      return (
        <Container className="py-16">
          <EmptyState
            icon={<PackageX className="size-7" aria-hidden="true" />}
            title="Pedido não encontrado"
            action={
              <Link to="/painel/meus-pedidos" className={buttonStyles({ variant: "outline" })}>
                Ver meus pedidos
              </Link>
            }
          />
        </Container>
      );
    }
    return (
      <Container className="py-16">
        <ErrorState error={order.error} onRetry={() => void order.refetch()} retrying={order.isFetching} />
      </Container>
    );
  }

  const data = order.data!;
  const shippingAddress = addresses.data?.find((address) => address.address_id === data.shipping_address_id);
  const allPayments = payments.data ?? [];
  const openPayment = allPayments.find((payment) => isOpenPayment(payment.status));
  const paidPayment = allPayments.find((payment) => isPaidPayment(payment.status));
  const handleCreatePayment = async (payload: PaymentCreateIn) => {
    setCreateError(null);
    try {
      await createPayment.mutateAsync(payload);
    } catch (error) {
      setCreateError(error);
      throw error; // deixa o CardPaymentForm também mostrar/limpar os campos sensíveis
    }
  };

  return (
    <Container className="py-8 sm:py-12">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink-soft">Pedido {data.code}</p>
          <h1 className="text-4xl font-semibold sm:text-5xl">Pagamento</h1>
        </div>
        <OrderStatusBadge status={data.order_status} />
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_24rem]">
        <div className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-6 sm:p-8">
          {data.order_status === "CANCELLED" || data.order_status === "FAILED" ? (
            <Alert tone="error">Este pedido {data.order_status === "CANCELLED" ? "foi cancelado" : "falhou"} e não pode mais ser pago.</Alert>
          ) : paidPayment ? (
            <div className="py-4 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-full bg-olive-50 text-olive-600">
                <CircleCheck className="size-7" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-2xl font-semibold">Pagamento confirmado</h2>
              <p className="mt-2 text-ink-soft">Recebemos o pagamento de {formatBRL(paidPayment.value)}. Já estamos preparando seu pedido.</p>
              <Link to="/painel/meus-pedidos" className={`${buttonStyles({ variant: "outline" })} mt-6 inline-flex`}>
                Ver meus pedidos
              </Link>
            </div>
          ) : openPayment ? (
            <div>
              <div className="mb-6 flex items-center justify-between gap-3">
                <h2 className="text-2xl font-semibold">Aguardando pagamento</h2>
                <PaymentStatusBadge status={openPayment.status} />
              </div>
              {openPayment.billing_type === "PIX" && <PixPayment payment={openPayment} />}
              {openPayment.billing_type === "BOLETO" && <BoletoPayment payment={openPayment} />}
              {openPayment.billing_type === "CREDIT_CARD" && (
                <p className="text-center text-ink-soft">Estamos confirmando o pagamento do seu cartão. Isso costuma levar poucos segundos.</p>
              )}
              <p className="mt-6 text-center text-xs text-ink-soft">Esta página atualiza sozinha assim que o pagamento for confirmado.</p>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-semibold">Como você quer pagar?</h2>
              <div className="mt-5">
                <PaymentMethodPicker value={method} onChange={setMethod} disabled={createPayment.isPending} />
              </div>

              {/* Cartão mostra o próprio erro dentro do formulário — evita duplicar a mesma mensagem. */}
              {method !== "CREDIT_CARD" && Boolean(createError) && !createPayment.isPending && (
                <Alert tone="error" className="mt-5">
                  {paymentErrorMessage(createError, "Não foi possível gerar a cobrança. Tente novamente.")}
                </Alert>
              )}

              <div className="mt-6">
                {method === "CREDIT_CARD" ? (
                  <CardPaymentForm
                    submitLabel={`Pagar ${formatBRL(data.total_geral)}`}
                    defaults={{
                      name: [me?.client?.first_name, me?.client?.last_name].filter(Boolean).join(" "),
                      email: me?.user.email ?? "",
                      cpf_cnpj: me?.client?.cpf ?? "",
                      postal_code: shippingAddress?.cep ?? "",
                      address_number: shippingAddress?.number ?? "",
                      phone: me?.client?.phone ?? "",
                    }}
                    onSubmit={handleCreatePayment}
                  />
                ) : (
                  <Button size="lg" fullWidth loading={createPayment.isPending} onClick={() => void handleCreatePayment({ billing_type: method })}>
                    {`Gerar cobrança de ${formatBRL(data.total_geral)}`}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <OrderSummaryCard order={data} />
      </div>
    </Container>
  );
}