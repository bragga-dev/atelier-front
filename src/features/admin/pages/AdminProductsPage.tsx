// frontend/src/features/admin/pages/AdminProductsPage.tsx
import { useState } from "react";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "react-router";
import type { ProductListOut } from "@/api/types";
import { DataTable } from "@/components/panel/DataTable";
import { PageHeader } from "@/components/panel/PageHeader";
import { PagerButtons } from "@/components/panel/PagerButtons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { SelectField, TextField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { buttonStyles } from "@/components/ui/button-styles";
import { ProductImage } from "@/features/catalog/components/ProductImage";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { formatBRL } from "@/lib/format";
import { useAdminCategories, useAdminProducts, useProductActions } from "../hooks";

export default function AdminProductsPage() {
  const [text, setText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [toDelete, setToDelete] = useState<ProductListOut | null>(null);
  const search = useDebouncedValue(text.trim(), 400);
  const products = useAdminProducts({ page, search: search || undefined, categoryId: categoryId || undefined, activeOnly });
  const categories = useAdminCategories();
  const actions = useProductActions();

  return (
    <>
      <PageHeader
        title="Produtos"
        description="Cadastre peças, ajuste preço e estoque e controle o que aparece na loja."
        actions={<Link to="/admin/produtos/novo" className={buttonStyles({})}><Plus className="size-4" aria-hidden="true" />Novo produto</Link>}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-[1fr_14rem_auto] sm:items-end">
        <TextField label="Buscar" placeholder="Nome do produto ou categoria" value={text} onChange={(e) => { setText(e.target.value); setPage(1); }} />
        <SelectField label="Categoria" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setPage(1); }}>
          <option value="">Todas</option>
          {categories.data?.items.map((c) => <option key={c.product_category_id} value={c.product_category_id}>{c.category_name}</option>)}
        </SelectField>
        <label className="flex h-12 items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={activeOnly} onChange={(e) => { setActiveOnly(e.target.checked); setPage(1); }} className="size-4 accent-oxblood-600" />
          Só ativos
        </label>
      </div>

      {products.isPending ? <Skeleton className="h-64" /> : products.isError ? (
        <ErrorState error={products.error} onRetry={() => void products.refetch()} retrying={products.isFetching} />
      ) : products.data.items.length === 0 ? (
        <p className="py-10 text-ink-soft">Nenhum produto encontrado.</p>
      ) : (
        <>
          <DataTable caption="Produtos" rows={products.data.items} rowKey={(p) => p.product_id}
            columns={[
              { header: "Produto", cell: (p) => (
                <span className="flex items-center gap-3">
                  <span className="size-12 shrink-0 overflow-hidden rounded-lg bg-sand"><ProductImage src={p.cover_image?.product_image_url} alt="" className="size-full" /></span>
                  <span className="min-w-0"><Link to={`/admin/produtos/${p.product_id}`} className="block truncate font-semibold hover:underline">{p.product_name}</Link>
                    <span className="block truncate text-xs text-ink-soft">{p.categories.map((c) => c.category_name).join(", ") || "Sem categoria"}</span></span>
                </span>
              ) },
              { header: "Preço", cell: (p) => formatBRL(p.price) },
              { header: "Estoque", cell: (p) => <span className={p.stock <= 5 ? "font-semibold text-oxblood-700" : ""}>{p.stock}</span> },
              { header: "Status", cell: (p) => <Badge tone={p.is_active ? "success" : "neutral"}>{p.is_active ? "Ativo" : "Inativo"}</Badge>, hideOnMobile: true },
              { header: "Ações", className: "text-right", cell: (p) => (
                <span className="flex justify-end gap-1">
                  <Link to={`/admin/produtos/${p.product_id}`} aria-label={`Editar ${p.product_name}`} className={buttonStyles({ variant: "ghost", size: "sm" })}><Pencil className="size-4" aria-hidden="true" /></Link>
                  <Button variant="ghost" size="sm" aria-label={p.is_active ? `Desativar ${p.product_name}` : `Ativar ${p.product_name}`}
                    onClick={() => (p.is_active ? actions.deactivate : actions.activate).mutate(p.product_id)}>
                    {p.is_active ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                  </Button>
                  <Button variant="ghost" size="sm" aria-label={`Excluir ${p.product_name}`} onClick={() => setToDelete(p)}><Trash2 className="size-4" aria-hidden="true" /></Button>
                </span>
              ) },
            ]} />
          <PagerButtons page={products.data.page} pages={products.data.pages} onChange={setPage} />
        </>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir produto?"
        description={toDelete ? `“${toDelete.product_name}” será removido. Se ele já tem pedidos, prefira desativar.` : undefined}
        confirmLabel="Excluir"
        loading={actions.remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && actions.remove.mutate(toDelete.product_id, { onSettled: () => setToDelete(null) })}
      />
    </>
  );
}