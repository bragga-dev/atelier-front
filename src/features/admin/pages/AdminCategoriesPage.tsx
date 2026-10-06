// frontend/src/features/admin/pages/AdminCategoriesPage.tsx
import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import type { CategoryOut } from "@/api/types";
import { PageHeader } from "@/components/panel/PageHeader";
import { Section } from "@/components/panel/Section";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { TextField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { applyApiErrors } from "@/features/auth/apply-api-errors";
import { ProductImage } from "@/features/catalog/components/ProductImage";
import { useAdminCategories, useCategoryActions } from "../hooks";
import { categorySchema, type CategoryFormValues } from "../schemas";

function CategoryForm({ category, onDone }: { category?: CategoryOut; onDone: () => void }) {
  const { create, update } = useCategoryActions();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { category_name: category?.category_name ?? "" },
  });
  const pending = create.isPending || update.isPending;

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      if (category) await update.mutateAsync({ id: category.product_category_id, ...v });
      else await create.mutateAsync(v);
      onDone();
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["category_name"], "Não foi possível salvar a categoria."));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-wrap items-start gap-3">
      <div className="min-w-56 flex-1">
        <TextField label="Nome da categoria" error={errors.category_name?.message} {...register("category_name")} />
        {formError && <Alert tone="error" className="mt-2">{formError}</Alert>}
      </div>
      <div className="flex gap-2 pt-7">
        <Button type="submit" loading={pending}>Salvar</Button>
        <Button variant="ghost" onClick={onDone} disabled={pending}>Cancelar</Button>
      </div>
    </form>
  );
}

export default function AdminCategoriesPage() {
  const categories = useAdminCategories();
  const actions = useCategoryActions();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<CategoryOut | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [imageFor, setImageFor] = useState<string | null>(null);

  return (
    <>
      <PageHeader title="Categorias" description="Organizam o catálogo e aparecem no menu da loja."
        actions={!adding && <Button onClick={() => { setAdding(true); setEditingId(null); }}><Plus className="size-4" aria-hidden="true" />Nova categoria</Button>} />

      {adding && <Section title="Nova categoria" className="mb-6"><CategoryForm onDone={() => setAdding(false)} /></Section>}

      <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Enviar imagem da categoria"
        onChange={(e) => { const file = e.target.files?.[0]; if (file && imageFor) actions.uploadImage.mutate({ id: imageFor, file }); e.target.value = ""; }} />

      {categories.isPending ? <Skeleton className="h-48" /> : categories.isError ? (
        <ErrorState error={categories.error} onRetry={() => void categories.refetch()} retrying={categories.isFetching} />
      ) : categories.data.items.length === 0 ? <p className="py-10 text-ink-soft">Nenhuma categoria cadastrada.</p> : (
        <ul className="space-y-3">
          {categories.data.items.map((c) => (
            <li key={c.product_category_id} className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-4">
              {editingId === c.product_category_id ? <CategoryForm category={c} onDone={() => setEditingId(null)} /> : (
                <div className="flex flex-wrap items-center gap-4">
                  <span className="size-16 shrink-0 overflow-hidden rounded-xl bg-sand"><ProductImage src={c.category_image_url} alt="" className="size-full" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{c.category_name}</p>
                    <Badge tone={c.is_active ? "success" : "neutral"}>{c.is_active ? "Ativa" : "Inativa"}</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { setImageFor(c.product_category_id); fileInput.current?.click(); }} aria-label={`Trocar imagem de ${c.category_name}`}><ImagePlus className="size-4" aria-hidden="true" />Imagem</Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(c.product_category_id); setAdding(false); }} aria-label={`Renomear ${c.category_name}`}><Pencil className="size-4" aria-hidden="true" />Renomear</Button>
                    <Button variant="ghost" size="sm" onClick={() => actions.toggle.mutate({ id: c.product_category_id, active: !c.is_active })}>{c.is_active ? "Desativar" : "Ativar"}</Button>
                    <Button variant="ghost" size="sm" onClick={() => setToDelete(c)} aria-label={`Excluir ${c.category_name}`}><Trash2 className="size-4" aria-hidden="true" /></Button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog open={Boolean(toDelete)} title="Excluir categoria?" description={toDelete ? `“${toDelete.category_name}” será removida.` : undefined}
        confirmLabel="Excluir" loading={actions.remove.isPending} onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && actions.remove.mutate(toDelete.product_category_id, { onSettled: () => setToDelete(null) })} />
    </>
  );
}