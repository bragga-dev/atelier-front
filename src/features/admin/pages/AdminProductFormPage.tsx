// frontend/src/features/admin/pages/AdminProductFormPage.tsx
import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Star, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router";
import { PageHeader } from "@/components/panel/PageHeader";
import { Section } from "@/components/panel/Section";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { applyApiErrors } from "@/features/auth/apply-api-errors";
import { ProductImage } from "@/features/catalog/components/ProductImage";
import { toast } from "@/lib/toast";
import { useAdminCategories, useAdminProduct, useCreateProductFull, useProductActions, useProductImages, useUpdateProduct } from "../hooks";
import { productCreateSchema, productSchema, toDecimal, type ProductFormValues } from "../schemas";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

function validateImages(files: File[]): string | null {
  for (const f of files) {
    if (!IMAGE_TYPES.includes(f.type)) return `“${f.name}”: use JPG, PNG ou WebP.`;
    if (f.size > MAX_IMAGE_BYTES) return `“${f.name}” passa de 5 MB.`;
  }
  return null;
}

function CategoryChecks({ value, onChange, error }: { value: string[]; onChange: (v: string[]) => void; error?: string }) {
  const categories = useAdminCategories();
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-semibold">Categorias</legend>
      {categories.isPending ? <Skeleton className="h-10" /> : (
        <div className="flex flex-wrap gap-2">
          {categories.data?.items.map((c) => {
            const checked = value.includes(c.product_category_id);
            return (
              <label key={c.product_category_id} className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm font-semibold ${checked ? "border-oxblood-600 bg-oxblood-50 text-oxblood-700" : "border-sand-200 hover:border-ink/30"}`}>
                <input type="checkbox" className="sr-only" checked={checked}
                  onChange={() => onChange(checked ? value.filter((id) => id !== c.product_category_id) : [...value, c.product_category_id])} />
                {c.category_name}
              </label>
            );
          })}
        </div>
      )}
      {error && <p role="alert" className="mt-1.5 text-sm font-medium text-red-700">{error}</p>}
    </fieldset>
  );
}

function ImageManager({ productId, images }: { productId: string; images: { image_id: string; product_image_url: string; is_cover: boolean }[] }) {
  const { add, setCover, remove } = useProductImages(productId);
  const [error, setError] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const onPick = async (list: FileList | null) => {
    const files = Array.from(list ?? []);
    const problem = validateImages(files);
    if (problem) return setError(problem);
    setError(null);
    for (const file of files) await add.mutateAsync(file).catch((e) => setError(e instanceof Error ? e.message : "Falha no envio."));
    if (input.current) input.current.value = "";
  };

  return (
    <Section title="Imagens" description="A imagem de capa aparece nas listagens da loja.">
      {error && <Alert tone="error" className="mb-3">{error}</Alert>}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {images.map((img) => (
          <li key={img.image_id} className="overflow-hidden rounded-xl border border-sand-200">
            <div className="aspect-square bg-sand"><ProductImage src={img.product_image_url} alt="" className="size-full" /></div>
            <div className="flex items-center justify-between gap-1 p-2">
              {img.is_cover ? <Badge tone="success">Capa</Badge> : (
                <Button variant="ghost" size="sm" onClick={() => setCover.mutate(img.image_id)} aria-label="Definir como capa"><Star className="size-4" aria-hidden="true" /></Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => remove.mutate(img.image_id)} aria-label="Excluir imagem"><Trash2 className="size-4" aria-hidden="true" /></Button>
            </div>
          </li>
        ))}
        <li>
          <input ref={input} id="nova-imagem" type="file" accept={IMAGE_TYPES.join(",")} multiple className="sr-only" onChange={(e) => void onPick(e.target.files)} />
          <label htmlFor="nova-imagem" className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-sand-200 text-center text-sm font-semibold text-ink-soft hover:border-oxblood-600 hover:text-oxblood-700">
            <span><ImagePlus className="mx-auto mb-1 size-6" aria-hidden="true" />{add.isPending ? "Enviando…" : "Adicionar"}</span>
          </label>
        </li>
      </ul>
    </Section>
  );
}

export default function AdminProductFormPage() {
  const { productId } = useParams();
  const editing = Boolean(productId);
  const navigate = useNavigate();
  const product = useAdminProduct(productId);
  const update = useUpdateProduct(productId ?? "");
  const create = useCreateProductFull();
  const actions = useProductActions();
  const [formError, setFormError] = useState<string | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);

  const p = product.data;
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(editing ? productSchema : productCreateSchema),
    values: p
      ? { product_name: p.product_name, category_ids: p.categories.map((c) => c.product_category_id), price: String(p.price), stock: String(p.stock), description: p.description, weight: "", height: "", width: "", length: "" }
      : undefined,
    defaultValues: { product_name: "", category_ids: [], price: "", stock: "0", description: "", weight: "", height: "", width: "", length: "" },
  });
  const { register, handleSubmit, setError, watch, setValue, formState: { errors } } = form;

  if (editing && product.isPending) return <Skeleton className="h-96" />;
  if (editing && product.isError) return <ErrorState error={product.error} onRetry={() => void product.refetch()} retrying={product.isFetching} />;

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);
    try {
      if (editing) {
        await update.mutateAsync({ product_name: v.product_name, category_ids: v.category_ids, price: toDecimal(v.price), stock: Number(v.stock), description: v.description });
      } else {
        const problem = validateImages(newImages);
        if (problem) return setFormError(problem);
        const created = await create.mutateAsync({
          data: {
            product_name: v.product_name, category_ids: v.category_ids, price: toDecimal(v.price), stock: Number(v.stock), description: v.description,
            shipping: { weight: toDecimal(v.weight), height: toDecimal(v.height), width: toDecimal(v.width), length: toDecimal(v.length), quantity: 1 },
          },
          images: newImages,
          coverIndex,
        });
        navigate(`/admin/produtos/${created.product_id}`, { replace: true });
        toast.info("Agora você pode ajustar as imagens abaixo.");
      }
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["product_name", "category_ids", "price", "stock", "description"], "Não foi possível salvar o produto."));
    }
  });

  const saving = update.isPending || create.isPending;

  return (
    <>
      <PageHeader title={editing ? "Editar produto" : "Novo produto"} actions={<Link to="/admin/produtos" className="text-sm font-semibold text-oxblood-700 hover:underline">← Voltar para produtos</Link>} />

      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {formError && <Alert tone="error">{formError}</Alert>}

        <Section title="Informações">
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="sm:col-span-3"><TextField label="Nome" error={errors.product_name?.message} {...register("product_name")} /></div>
            <TextField label="Preço (R$)" inputMode="decimal" placeholder="199,90" error={errors.price?.message} {...register("price")} />
            <TextField label="Estoque" inputMode="numeric" error={errors.stock?.message} {...register("stock")} />
            <div className="sm:col-span-3"><CategoryChecks value={watch("category_ids")} onChange={(v) => setValue("category_ids", v, { shouldValidate: true })} error={errors.category_ids?.message} /></div>
            <div className="sm:col-span-3"><TextAreaField label="Descrição" error={errors.description?.message} {...register("description")} /></div>
          </div>
        </Section>

        {!editing && (
          <>
            <Section title="Embalagem (frete)" description="Usada para cotar o frete e gerar a etiqueta. Não dá para editar depois por aqui.">
              <div className="grid gap-5 sm:grid-cols-4">
                <TextField label="Peso (kg)" inputMode="decimal" placeholder="0,3" error={errors.weight?.message} {...register("weight")} />
                <TextField label="Altura (cm)" inputMode="decimal" error={errors.height?.message} {...register("height")} />
                <TextField label="Largura (cm)" inputMode="decimal" error={errors.width?.message} {...register("width")} />
                <TextField label="Comprimento (cm)" inputMode="decimal" error={errors.length?.message} {...register("length")} />
              </div>
            </Section>

            <Section title="Imagens" description="JPG, PNG ou WebP, até 5 MB cada. Escolha a capa.">
              <input type="file" accept={IMAGE_TYPES.join(",")} multiple aria-label="Escolher imagens" onChange={(e) => { setNewImages(Array.from(e.target.files ?? [])); setCoverIndex(0); }} />
              {newImages.length > 0 && (
                <fieldset className="mt-3">
                  <legend className="mb-1 text-sm font-semibold">Capa</legend>
                  <ul className="space-y-1 text-sm">
                    {newImages.map((f, i) => (
                      <li key={`${f.name}-${i}`}><label className="flex items-center gap-2"><input type="radio" name="capa" checked={coverIndex === i} onChange={() => setCoverIndex(i)} className="accent-oxblood-600" />{f.name}</label></li>
                    ))}
                  </ul>
                </fieldset>
              )}
            </Section>
          </>
        )}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" size="lg" loading={saving}>{editing ? "Salvar alterações" : "Criar produto"}</Button>
          {editing && p && (
            <Button variant="outline" size="lg" onClick={() => (p.is_active ? actions.deactivate : actions.activate).mutate(p.product_id)}>
              {p.is_active ? "Desativar produto" : "Ativar produto"}
            </Button>
          )}
        </div>
      </form>

      {editing && p && <div className="mt-6"><ImageManager productId={p.product_id} images={p.images ?? []} /></div>}
    </>
  );
}