import { z } from "zod";
import { isValidCpf, onlyDigits } from "@/lib/cpf";

/** Perfil do cliente. CPF e telefone podem ficar em branco aqui; o checkout é quem exige o CPF. */
export const clientProfileSchema = z.object({
  first_name: z.string().trim().min(2, "Informe seu nome.").max(255, "No máximo 255 caracteres."),
  last_name: z.string().trim().min(2, "Informe seu sobrenome.").max(255, "No máximo 255 caracteres."),
  cpf: z.string().trim().refine((v) => v === "" || isValidCpf(v), "Informe um CPF válido."),
  phone: z.string().trim().refine((v) => v === "" || onlyDigits(v).length >= 10, "Informe o telefone com DDD."),
  birth_date: z.string().trim().refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Data inválida."),
  gender: z.enum(["Masculino", "Feminino", "Outro"]),
});
export type ClientProfileFormValues = z.infer<typeof clientProfileSchema>;

export const adminProfileSchema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome.").max(255, "No máximo 255 caracteres."),
});
export type AdminProfileFormValues = z.infer<typeof adminProfileSchema>;

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, "Informe sua senha atual."),
    new_password: z
      .string()
      .min(8, "Use pelo menos 8 caracteres.")
      .refine((v) => !/^\d+$/.test(v), "A senha não pode conter apenas números."),
    new_password2: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((v) => v.new_password === v.new_password2, { path: ["new_password2"], message: "As senhas não conferem." });
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const reviewSchema = z.object({
  reviews: z.number().int().min(1, "Escolha de 1 a 5 estrelas.").max(5),
  comment: z.string().trim().max(1000, "No máximo 1000 caracteres."),
});
export type ReviewFormValues = z.infer<typeof reviewSchema>;