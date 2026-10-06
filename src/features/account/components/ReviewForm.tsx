import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import type { ReviewPrivateOut } from "@/api/types";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { TextAreaField } from "@/components/ui/Field";
import { applyApiErrors } from "@/features/auth/apply-api-errors";
import { reviewSchema, type ReviewFormValues } from "../schemas";
import { StarPicker } from "./StarPicker";

interface ReviewFormProps {
  review?: ReviewPrivateOut;
  onSubmit: (values: { reviews: 1 | 2 | 3 | 4 | 5; comment: string | null }) => Promise<unknown>;
  onCancel?: () => void;
  submitLabel?: string;
}

/** Formulário de avaliação (nota + comentário) usado para criar e editar. */
export function ReviewForm({ review, onSubmit, onCancel, submitLabel = "Salvar avaliação" }: ReviewFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const { control, register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { reviews: review?.reviews ?? 0, comment: review?.comment ?? "" },
  });

  const submit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      await onSubmit({ reviews: values.reviews as 1 | 2 | 3 | 4 | 5, comment: values.comment || null });
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["reviews", "comment"], "Não foi possível salvar a avaliação."));
    }
  });

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      {formError && <Alert tone="error">{formError}</Alert>}
      <div>
        <Controller control={control} name="reviews" render={({ field }) => <StarPicker name="nota" value={field.value} onChange={field.onChange} />} />
        {errors.reviews && <p role="alert" className="mt-1 text-sm font-medium text-red-700">{errors.reviews.message}</p>}
      </div>
      <TextAreaField label="Comentário (opcional)" placeholder="Conte como foi sua experiência com a peça." error={errors.comment?.message} {...register("comment")} />
      <div className="flex gap-3">
        <Button type="submit" loading={isSubmitting}>{submitLabel}</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>}
      </div>
    </form>
  );
}