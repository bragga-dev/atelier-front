import { z } from "zod";
import { BRAZILIAN_STATE_CODES } from "@/lib/brazilian-states";

export const addressSchema = z.object({
  cep: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 8, "Informe um CEP com 8 dígitos."),
  street: z.string().trim().min(1, "Informe a rua."),
  number: z.string().trim().min(1, "Informe o número."),
  complement: z.string().trim(),
  neighborhood: z.string().trim().min(1, "Informe o bairro."),
  city: z.string().trim().min(1, "Informe a cidade."),
  state: z.enum(BRAZILIAN_STATE_CODES, { error: "Selecione um estado." }),
});

export type AddressFormValues = z.infer<typeof addressSchema>;