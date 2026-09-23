import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { AddressOut } from "@/api/types";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/Field";
import { applyApiErrors } from "@/features/auth/apply-api-errors";
import { BRAZILIAN_STATES } from "@/lib/brazilian-states";
import { formatCep } from "@/lib/mask";
import { useCreateAddress } from "../mutations";
import { addressSchema, type AddressFormValues } from "../schemas";

export function AddressForm({ onCreated, onCancel }: { onCreated: (address: AddressOut) => void; onCancel?: () => void }) {
  const createAddress = useCreateAddress();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { cep: "", street: "", number: "", complement: "", neighborhood: "", city: "", state: undefined },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const address = await createAddress.mutateAsync(values);
      onCreated(address);
    } catch (error) {
      setFormError(
        applyApiErrors(
          error,
          setError,
          ["cep", "street", "number", "complement", "neighborhood", "city", "state"],
          "Não foi possível salvar o endereço. Tente novamente.",
        ),
      );
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 rounded-md border border-sand-200 bg-white p-4">
      {formError && <Alert tone="error">{formError}</Alert>}

      <TextField
        label="CEP"
        inputMode="numeric"
        placeholder="00000-000"
        maxLength={9}
        error={errors.cep?.message}
        {...register("cep", {
          onChange: (event) => {
            event.target.value = formatCep(event.target.value);
          },
        })}
      />

      <div className="grid grid-cols-[1fr_120px] gap-3">
        <TextField label="Rua" error={errors.street?.message} {...register("street")} />
        <TextField label="Número" error={errors.number?.message} {...register("number")} />
      </div>

      <TextField label="Complemento (opcional)" error={errors.complement?.message} {...register("complement")} />
      <TextField label="Bairro" error={errors.neighborhood?.message} {...register("neighborhood")} />

      <div className="grid grid-cols-[1fr_140px] gap-3">
        <TextField label="Cidade" error={errors.city?.message} {...register("city")} />
        <div>
          <SelectField label="Estado" aria-invalid={errors.state ? true : undefined} {...register("state")}>
            <option value="">UF</option>
            {BRAZILIAN_STATES.map((state) => (
              <option key={state.code} value={state.code}>
                {state.code}
              </option>
            ))}
          </SelectField>
          {errors.state && <p className="mt-1.5 text-sm font-medium text-red-700">{errors.state.message}</p>}
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <Button type="submit" loading={createAddress.isPending}>
          Salvar endereço
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}