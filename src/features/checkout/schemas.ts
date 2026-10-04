import { z } from "zod";
import { STATE_VALUES } from "@/lib/br-states";
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

export const addressSchema = z.object({
  cep: z
    .string()
    .trim()
    .refine((value) => onlyDigits(value).length === 8, "Informe um CEP com 8 dígitos."),
  street: z.string().trim().min(3, "Informe a rua.").max(255, "No máximo 255 caracteres."),
  number: z.string().trim().min(1, "Informe o número (ou S/N).").max(20, "No máximo 20 caracteres."),
  complement: z.string().trim().max(255, "No máximo 255 caracteres."),
  neighborhood: z.string().trim().min(2, "Informe o bairro.").max(255, "No máximo 255 caracteres."),
  city: z.string().trim().min(2, "Informe a cidade.").max(255, "No máximo 255 caracteres."),
  state: z.enum(STATE_VALUES, { error: "Selecione o estado." }),
});

export type AddressFormValues = z.infer<typeof addressSchema>;