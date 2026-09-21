import { z } from "zod";

/** Limites espelham o backend: telefone com no máximo 20 caracteres (coluna do banco); nome até 255. */
export const contactSchema = z.object({
  full_name: z.string().trim().min(3, "Informe seu nome completo.").max(255, "No máximo 255 caracteres."),
  email: z.string().trim().min(1, "Informe seu e-mail.").pipe(z.email("Informe um e-mail válido.")),
  phone: z
    .string()
    .trim()
    .min(8, "Informe um telefone com DDD.")
    .max(20, "No máximo 20 caracteres.")
    .regex(/^[\d\s()+-]+$/, "Use apenas números, espaços, parênteses, + e -."),
  subject: z.string().trim().min(3, "Informe o assunto.").max(120, "No máximo 120 caracteres."),
  message: z.string().trim().min(10, "Conte um pouco mais (mínimo de 10 caracteres).").max(2000, "No máximo 2000 caracteres."),
});

export type ContactFormValues = z.infer<typeof contactSchema>;