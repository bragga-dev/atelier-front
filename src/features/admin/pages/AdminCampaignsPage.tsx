// frontend/src/features/admin/pages/AdminCampaignsPage.tsx
import { useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Images, Pencil, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import type { CampaignOut } from "@/api/types";
import { PageHeader } from "@/components/panel/PageHeader";
import { Section } from "@/components/panel/Section";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ErrorState } from "@/components/ui/ErrorState";
import { TextAreaField, TextField } from "@/components/ui/Field";
import { Skeleton } from "@/components/ui/Skeleton";
import { applyApiErrors } from "@/features/auth/apply-api-errors";
import { formatDateTime } from "@/lib/format";
import { useAdminCampaigns, useCampaignActions, useCampaignImages } from "../hooks";
import { campaignSchema, type CampaignFormValues } from "../schemas";

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO do backend → valor de <input type="datetime-local"> (horário local). */
function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Valor do <input type="datetime-local"> → ISO (ou null se vazio). */
function toIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function CampaignForm({ campaign, onDone }: { campaign?: CampaignOut; onDone: () => void }) {
  const { create, update } = useCampaignActions();
  const [formError, setFormError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: campaign?.title ?? "",
      description: campaign?.description ?? "",
      starts_at: toLocalInput(campaign?.starts_at),
      ends_at: toLocalInput(campaign?.ends_at),
    },
  });
  const pending = create.isPending || update.isPending;

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);
    const payload = {
      title: v.title,
      description: v.description || null,
      starts_at: toIso(v.starts_at),
      ends_at: toIso(v.ends_at),
    };
    try {
      if (campaign) await update.mutateAsync({ id: campaign.campaign_id, ...payload });
      else await create.mutateAsync(payload);
      onDone();
    } catch (error) {
      setFormError(applyApiErrors(error, setError, ["title", "description", "starts_at", "ends_at"], "Não foi possível salvar a campanha."));
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2"><TextField label="Título" error={errors.title?.message} {...register("title")} /></div>
      <div className="sm:col-span-2"><TextAreaField label="Descrição" rows={3} error={errors.description?.message} {...register("description")} /></div>
      <TextField label="Início" type="datetime-local" error={errors.starts_at?.message} {...register("starts_at")} />
      <TextField label="Fim" type="datetime-local" error={errors.ends_at?.message} {...register("ends_at")} />
      {formError && <Alert tone="error" className="sm:col-span-2">{formError}</Alert>}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" loading={pending}>Salvar</Button>
        <Button variant="ghost" onClick={onDone} disabled={pending}>Cancelar</Button>
      </div>
    </form>
  );
}

function CampaignImages({ campaignId }: { campaignId: string }) {
  const images = useCampaignImages(campaignId, true);
  const { addImage, removeImage } = useCampaignActions();
  const fileInput = useRef<HTMLInputElement>(null);
  const [asCover, setAsCover] = useState(false);

  return (
    <div className="mt-4 border-t border-sand-200 pt-4">
      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Enviar imagem da campanha"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) addImage.mutate({ id: campaignId, file, isCover: asCover });
          e.target.value = "";
        }}
      />
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <Button size="sm" variant="outline" loading={addImage.isPending} onClick={() => { setAsCover(false); fileInput.current?.click(); }}>
          <ImagePlus className="size-4" aria-hidden="true" />Adicionar imagem
        </Button>
        <Button size="sm" variant="ghost" disabled={addImage.isPending} onClick={() => { setAsCover(true); fileInput.current?.click(); }}>
          Enviar como capa
        </Button>
      </div>

      {images.isPending ? <Skeleton className="h-24" /> : images.isError ? (
        <ErrorState error={images.error} onRetry={() => void images.refetch()} retrying={images.isFetching} />
      ) : images.data.length === 0 ? (
        <p className="text-sm text-ink-soft">Nenhuma imagem enviada.</p>
      ) : (
        <ul className="flex flex-wrap gap-3">
          {images.data.map((img) => (
            <li key={img.campaign_mage_id} className="relative">
              <img src={img.image_url} alt="" className="h-24 w-36 rounded-lg object-cover" loading="lazy" />
              {img.is_cover && <span className="absolute left-1 top-1"><Badge tone="success">Capa</Badge></span>}
              <button
                type="button"
                aria-label="Remover imagem"
                onClick={() => removeImage.mutate({ imageId: img.campaign_mage_id, campaignId })}
                className="absolute right-1 top-1 grid size-7 place-items-center rounded-full bg-white/90 shadow"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminCampaignsPage() {
  const campaigns = useAdminCampaigns();
  const actions = useCampaignActions();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imagesId, setImagesId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<CampaignOut | null>(null);

  return (
    <>
      <PageHeader
        title="Campanhas"
        description="Coleções e promoções exibidas no carrossel da home."
        actions={!adding && <Button onClick={() => { setAdding(true); setEditingId(null); }}><Plus className="size-4" aria-hidden="true" />Nova campanha</Button>}
      />

      {adding && <Section title="Nova campanha" className="mb-6"><CampaignForm onDone={() => setAdding(false)} /></Section>}

      {campaigns.isPending ? <Skeleton className="h-48" /> : campaigns.isError ? (
        <ErrorState error={campaigns.error} onRetry={() => void campaigns.refetch()} retrying={campaigns.isFetching} />
      ) : campaigns.data.items.length === 0 ? <p className="py-10 text-ink-soft">Nenhuma campanha cadastrada.</p> : (
        <ul className="space-y-3">
          {campaigns.data.items.map((c) => (
            <li key={c.campaign_id} className="rounded-[var(--radius-card)] border border-sand-200 bg-white p-4">
              {editingId === c.campaign_id ? <CampaignForm campaign={c} onDone={() => setEditingId(null)} /> : (
                <>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold">{c.title}</p>
                      {c.description && <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{c.description}</p>}
                      <p className="mt-1 text-xs text-ink-soft">
                        {c.starts_at ? formatDateTime(c.starts_at) : "Sem início"} → {c.ends_at ? formatDateTime(c.ends_at) : "Sem fim"}
                      </p>
                      <div className="mt-1"><Badge tone={c.is_active ? "success" : "neutral"}>{c.is_active ? "Ativa" : "Inativa"}</Badge></div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setImagesId(imagesId === c.campaign_id ? null : c.campaign_id)} aria-label={`Imagens de ${c.title}`}><Images className="size-4" aria-hidden="true" />Imagens</Button>
                      <Button variant="ghost" size="sm" onClick={() => { setEditingId(c.campaign_id); setAdding(false); }} aria-label={`Editar ${c.title}`}><Pencil className="size-4" aria-hidden="true" />Editar</Button>
                      <Button variant="ghost" size="sm" onClick={() => actions.toggle.mutate({ id: c.campaign_id, active: !c.is_active })}>{c.is_active ? "Desativar" : "Ativar"}</Button>
                      <Button variant="ghost" size="sm" onClick={() => setToDelete(c)} aria-label={`Excluir ${c.title}`}><Trash2 className="size-4" aria-hidden="true" /></Button>
                    </div>
                  </div>
                  {imagesId === c.campaign_id && <CampaignImages campaignId={c.campaign_id} />}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir campanha?"
        description={toDelete ? `“${toDelete.title}” será removida.` : undefined}
        confirmLabel="Excluir"
        loading={actions.remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && actions.remove.mutate(toDelete.campaign_id, { onSettled: () => setToDelete(null) })}
      />
    </>
  );
}