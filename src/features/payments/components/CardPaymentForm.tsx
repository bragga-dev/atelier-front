import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { PaymentCreateIn } from "@/api/types";
import { paymentErrorMessage } from "../error-message";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Field";
import { formatCardNumber, formatExpiry, parseExpiry } from "@/lib/card";
import { formatCpf, onlyDigits } from "@/lib/cpf";
import { formatCep, formatPhone } from "@/lib/mask";
import { cardPaymentSchema, type CardPaymentFormValues } from "../schemas";

interface CardPaymentFormProps {
  defaults: Partial<Pick<CardPaymentFormValues, "name" | "email" | "cpf_cnpj" | "postal_code" | "address_number" | "phone">>;
  submitLabel: string;
  onSubmit: (payload: PaymentCreateIn) => Promise<unknown>;
}

/** Cartão: os dados só existem neste formulário — não vão para storage nenhum e são limpos ao enviar. */
export function CardPaymentForm({ defaults, submitLabel, onSubmit }: CardPaymentFormProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CardPaymentFormValues>({
    resolver: zodResolver(cardPaymentSchema),
    defaultValues: {
      holder_name: "",
      number: "",
      expiry: "",
      ccv: "",
      name: defaults.name ?? "",
      email: defaults.email ?? "",
      cpf_cnpj: defaults.cpf_cnpj ?? "",
      postal_code: defaults.postal_code ?? "",
      address_number: defaults.address_number ?? "",
      phone: defaults.phone ?? "",
    },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    const expiry = parseExpiry(values.expiry);
    if (!expiry) return;

    try {
      await onSubmit({
        billing_type: "CREDIT_CARD",
        credit_card: {
          holder_name: values.holder_name,
          number: onlyDigits(values.number),
          expiry_month: expiry.month,
          expiry_year: expiry.year,
          ccv: values.ccv,
        },
        credit_card_holder_info: {
          name: values.name,
          email: values.email,
          cpf_cnpj: onlyDigits(values.cpf_cnpj),
          postal_code: onlyDigits(values.postal_code),
          address_number: values.address_number,
          phone: values.phone ? onlyDigits(values.phone) : null,
        },
      });
    } catch (error) {
      // A recusa (502 da Asaas) vem com o motivo; a pessoa pode corrigir e tentar de novo.
      setFormError(paymentErrorMessage(error, "Não foi possível processar o cartão. Confira os dados e tente novamente."));
    } finally {
      // Dados sensíveis saem do estado do formulário, deu certo ou não.
      reset((current) => ({ ...current, number: "", expiry: "", ccv: "" }));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {formError && <Alert tone="error">{formError}</Alert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <TextField
            label="Número do cartão"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            error={errors.number?.message}
            {...register("number", { onChange: (event) => (event.target.value = formatCardNumber(event.target.value)) })}
          />
        </div>
        <div className="sm:col-span-2">
          <TextField label="Nome impresso no cartão" autoComplete="cc-name" error={errors.holder_name?.message} {...register("holder_name")} />
        </div>
        <TextField
          label="Validade"
          inputMode="numeric"
          autoComplete="cc-exp"
          placeholder="MM/AA"
          maxLength={5}
          error={errors.expiry?.message}
          {...register("expiry", { onChange: (event) => (event.target.value = formatExpiry(event.target.value)) })}
        />
        <TextField
          label="Código de segurança"
          inputMode="numeric"
          autoComplete="cc-csc"
          placeholder="CVV"
          maxLength={4}
          error={errors.ccv?.message}
          {...register("ccv")}
        />
      </div>

      <div>
        <h3 className="font-sans text-sm font-semibold uppercase tracking-[0.14em] text-ink-soft">Titular do cartão</h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <TextField label="Nome completo" autoComplete="off" error={errors.name?.message} {...register("name")} />
          <TextField label="E-mail" type="email" autoComplete="off" error={errors.email?.message} {...register("email")} />
          <TextField
            label="CPF ou CNPJ"
            inputMode="numeric"
            autoComplete="off"
            error={errors.cpf_cnpj?.message}
            {...register("cpf_cnpj", {
              onChange: (event) => {
                if (onlyDigits(event.target.value).length <= 11) event.target.value = formatCpf(event.target.value);
              },
            })}
          />
          <TextField
            label="Telefone (opcional)"
            type="tel"
            autoComplete="off"
            inputMode="tel"
            error={errors.phone?.message}
            {...register("phone", { onChange: (event) => (event.target.value = formatPhone(event.target.value)) })}
          />
          <TextField
            label="CEP do titular"
            inputMode="numeric"
            autoComplete="off"
            maxLength={9}
            error={errors.postal_code?.message}
            {...register("postal_code", { onChange: (event) => (event.target.value = formatCep(event.target.value)) })}
          />
          <TextField label="Número do endereço" autoComplete="off" error={errors.address_number?.message} {...register("address_number")} />
        </div>
      </div>

      <Button type="submit" size="lg" fullWidth loading={isSubmitting}>
        {submitLabel}
      </Button>
      <p className="text-center text-xs text-ink-soft">Seus dados de cartão são enviados direto para o processador de pagamento e não ficam salvos na loja.</p>
    </form>
  );
}