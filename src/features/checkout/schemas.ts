// frontend/src/features/checkout/schemas.ts
import { z } from "zod";
import { isValidCpf, onlyDigits } from "@/lib/cpf";

/**
 * Espelha o que o checkout exige do backend (`ClientCompleteProfileAuth`): nome, sobrenome, CPF e
 * ao menos um endereço. O backend continua sendo a fonte de verdade — 400/403 voltam para os campos.
 */
export const profileSchema = z.object({
  first_name: z.string().trim().min(2, "Informe seu nome.").max(255, "No máximo 255 caracteres."),
  last_name: z.string().trim().min(2, "Informe seu sobrenome.").max(255, "No máximo 255 caracteres."),
  cpf: z.string().trim().refine(isValidCpf, "Informe um CPF válido."),
  phone: z
    .string()
    .trim()
    .refine((value) => value === "" || onlyDigits(value).length >= 10, "Informe o telefone com DDD."),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export { addressSchema, type AddressFormValues } from "@/features/address/schemas";