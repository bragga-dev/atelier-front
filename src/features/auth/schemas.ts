import { z } from "zod";

/**
 * Validação client-side (UX rápida). O backend continua sendo a fonte de verdade:
 * ele ainda aplica os validadores de senha do Django (senha comum, parecida com o e-mail…)
 * e devolve 422 com a mensagem do campo — que exibimos no formulário.
 */
const email = z
  .string()
  .trim()
  .min(1, "Informe seu e-mail.")
  .pipe(z.email("Informe um e-mail válido."));

const newPassword = z
  .string()
  .min(8, "Use pelo menos 8 caracteres.")
  .refine((value) => !/^\d+$/.test(value), "A senha não pode conter apenas números.");

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Informe sua senha."),
});

export const registerSchema = z
  .object({
    email,
    password: newPassword,
    password2: z.string().min(1, "Confirme a senha."),
  })
  .refine((values) => values.password === values.password2, {
    message: "As senhas não coincidem.",
    path: ["password2"],
  });

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    new_password: newPassword,
    new_password2: z.string().min(1, "Confirme a nova senha."),
  })
  .refine((values) => values.new_password === values.new_password2, {
    message: "As senhas não coincidem.",
    path: ["new_password2"],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
