import { z } from "zod";

export const shippingQuoteSchema = z.object({
  cep: z
    .string()
    .trim()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => value.length === 8, "Informe um CEP com 8 dígitos."),
});

export type ShippingQuoteFormValues = z.infer<typeof shippingQuoteSchema>;