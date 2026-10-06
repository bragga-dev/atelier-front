// frontend/src/features/address/components/AddressForm.tsx
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { AddressOut } from "@/api/types";
import { isApiError } from "@/api/errors";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { applyApiErrors } from "@/features/auth/apply-api-errors";
import { BRAZILIAN_STATES } from "@/lib/br-states";
import { formatCep } from "@/lib/mask";
import { useCreateAddress, useUpdateAddress } from "../mutations";
import { addressSchema, type AddressFormValues } from "../schemas";

interface AddressFormProps {
  onCreated: (address: AddressOut) => void;
  onCancel?: () => void;
  /** Se informado, o formulário edita este endereço (PATCH) em vez de criar um novo. */
  address?: AddressOut;
}

export function AddressForm({ onCreated, onCancel, address }: AddressFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress(address?.address_id ?? "");
  const saveAddress = address ? updateAddress : createAddress;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: address
      ? {
          cep: formatCep(address.cep),
          street: address.street,
          number: address.number,
          complement: address.complement ?? "",
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
        }
      : { cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: undefined },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const created = await saveAddress.mutateAsync({
        ...values,
        cep: values.cep.replace(/\D/g, ""),
        // Sem complemento, não enviamos o campo (o backend aceita ausente).
        complement: values.complement || null,
      });
      onCreated(created);
    } catch (error) {
      // O backend valida o CEP de verdade (consulta externa) e responde 400 com a frase do problema.
      if (isApiError(error) && error.status === 400 && /cep/i.test(error.detail ?? "")) {
        setError("cep", { type: "server", message: error.detail ?? "CEP inválido." });
        return;
      }
      setFormError(
        applyApiErrors(
          error,
          setError,
          ["cep", "street", "number", "complement", "neighborhood", "city", "state"],
          "Não foi possível salvar o endereço.",
        ),
      );
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <Alert tone="error">{formError}</Alert>}

      <div className="grid gap-5 sm:grid-cols-6">
        <div className="sm:col-span-2">
          <TextField
            label="CEP"
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder="00000-000"
            maxLength={9}
            error={errors.cep?.message}
            {...register("cep", { onChange: (event) => (event.target.value = formatCep(event.target.value)) })}
          />
        </div>
        <div className="sm:col-span-4">
          <TextField label="Rua" autoComplete="address-line1" error={errors.street?.message} {...register("street")} />
        </div>
        <div className="sm:col-span-2">
          <TextField label="Número" autoComplete="off" error={errors.number?.message} {...register("number")} />
        </div>
        <div className="sm:col-span-4">
          <TextField label="Complemento (opcional)" autoComplete="address-line2" error={errors.complement?.message} {...register("complement")} />
        </div>
        <div className="sm:col-span-3">
          <TextField label="Bairro" autoComplete="off" error={errors.neighborhood?.message} {...register("neighborhood")} />
        </div>
        <div className="sm:col-span-3">
          <TextField label="Cidade" autoComplete="address-level2" error={errors.city?.message} {...register("city")} />
        </div>
        <div className="sm:col-span-3">
          <SelectField label="Estado" defaultValue="" {...register("state")}>
            <option value="" disabled>
              Selecione
            </option>
            {BRAZILIAN_STATES.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </SelectField>
          {errors.state && (
            <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">
              {errors.state.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={saveAddress.isPending}>
          Salvar endereço
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={saveAddress.isPending}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}