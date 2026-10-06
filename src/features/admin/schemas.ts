// frontend/src/features/admin/schemas.ts
import { z } from "zod";

const money = z.string().trim().refine((v) => /^\d+([.,]\d{1,2})?$/.test(v) && Number(v.replace(",", ".")) > 0, "Informe um valor maior que zero.");
const positiveDecimal = (label: string) =>
  z.string().trim().refine((v) => /^\d+([.,]\d+)?$/.test(v) && Number(v.replace(",", ".")) > 0, `Informe ${label} maior que zero.`);

export const productSchema = z.object({
  product_name: z.string().trim().min(2, "Informe o nome.").max(255, "No máximo 255 caracteres."),
  category_ids: z.array(z.string()).min(1, "Escolha pelo menos uma categoria."),
  price: money,
  stock: z.string().trim().refine((v) => /^\d+$/.test(v), "Informe um número inteiro (0 ou mais)."),
  description: z.string().trim().max(5000, "No máximo 5000 caracteres."),
  // Frete: só na criação (a API não edita peso/dimensões depois).
  weight: z.string().trim(),
  height: z.string().trim(),
  width: z.string().trim(),
  length: z.string().trim(),
});
export type ProductFormValues = z.infer<typeof productSchema>;

/** Na criação peso e dimensões são obrigatórios (o frete e a etiqueta dependem deles). */
export const productCreateSchema = productSchema.extend({
  weight: positiveDecimal("um peso (kg)"),
  height: positiveDecimal("uma altura (cm)"),
  width: positiveDecimal("uma largura (cm)"),
  length: positiveDecimal("um comprimento (cm)"),
});

export const categorySchema = z.object({ category_name: z.string().trim().min(2, "Informe o nome.").max(255, "No máximo 255 caracteres.") });
export type CategoryFormValues = z.infer<typeof categorySchema>;

export const campaignSchema = z.object({
  title: z.string().trim().min(2, "Informe o título.").max(255, "No máximo 255 caracteres."),
  description: z.string().trim().max(2000, "No máximo 2000 caracteres."),
  starts_at: z.string(),
  ends_at: z.string(),
}).refine((v) => !v.starts_at || !v.ends_at || v.ends_at >= v.starts_at, { path: ["ends_at"], message: "O fim deve ser depois do início." });
export type CampaignFormValues = z.infer<typeof campaignSchema>;

export const toDecimal = (v: string) => v.replace(",", ".");