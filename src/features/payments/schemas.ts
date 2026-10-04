import { z } from "zod";
import { isValidCardNumber, parseExpiry } from "@/lib/card";
import { isValidCpf, isValidCpfOrCnpjLength, onlyDigits } from "@/lib/cpf";

/**
 * Dados do cartão: validados aqui só para poupar uma ida à Asaas com erro óbvio (Luhn, validade).
 * Quem decide se o cartão passa é a Asaas — a recusa volta como mensagem no formulário.
 */
export const cardPaymentSchema = z.object({
  holder_name: z.string().trim().min(3, "Informe o nome como está no cartão.").max(255, "No máximo 255 caracteres."),
  number: z.string().trim().refine(isValidCardNumber, "Número de cartão inválido."),
  expiry: z.string().trim().refine((value) => parseExpiry(value) !== null, "Validade inválida ou vencida (use MM/AA)."),
  ccv: z.string().trim().regex(/^\d{3,4}$/, "Código de segurança com 3 ou 4 dígitos."),
  name: z.string().trim().min(3, "Informe o nome do titular.").max(255, "No máximo 255 caracteres."),
  email: z.string().trim().min(1, "Informe o e-mail do titular.").pipe(z.email("Informe um e-mail válido.")),
  cpf_cnpj: z
    .string()
    .trim()
    .refine(isValidCpfOrCnpjLength, "Informe um CPF ou CNPJ válido.")
    .refine((value) => onlyDigits(value).length !== 11 || isValidCpf(value), "CPF inválido."),
  postal_code: z.string().trim().refine((value) => onlyDigits(value).length === 8, "Informe um CEP com 8 dígitos."),
  address_number: z.string().trim().min(1, "Informe o número.").max(20, "No máximo 20 caracteres."),
  phone: z.string().trim().refine((value) => value === "" || onlyDigits(value).length >= 10, "Informe o telefone com DDD."),
});

export type CardPaymentFormValues = z.infer<typeof cardPaymentSchema>;