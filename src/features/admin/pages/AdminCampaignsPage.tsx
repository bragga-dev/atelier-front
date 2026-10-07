// frontend/src/features/admin/pages/AdminCampaignsPage.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Pencil, Plus, Star, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toUserMessage } from "@/api/errors";
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
import { toast } from "@/lib/toast";
import { useAdminCampaigns, useCampaignActions, useCampaignImages, useCreateCampaignWithImages } from "../hooks";
import { campaignSchema, type CampaignFormValues } from "../schemas";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES_ON_CREATE = 10;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ACCEPT = IMAGE_TYPES.join(",");

function validateImages(files: File[]): string | null {
  for (const f of files) {
    if (!IMAGE_TYPES.includes(f.type)) return `“${f.name}”: use JPG, PNG, WebP ou AVIF.`;
    if (f.size > MAX_IMAGE_BYTES) return `“${f.name}” passa de 5 MB.`;
  }
  return null;
}

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

// ── Imagens escolhidas ainda no formulário de criação ────────────────────────
function NewImagesPicker({
  files, onChange, coverIndex, onCoverChange,
}: { files: File[]; onChange: (files: File[]) => void; coverIndex: number; onCoverChange: (index: number) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  const onPick = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    if (input.current) input.current.value = "";
    const problem = validateImages(picked);
    if (problem) return setError(problem);
    if (files.length + picked.length > MAX_IMAGES_ON_CREATE) return setError(`No máximo ${MAX_IMAGES_ON_CREATE} imagens por vez. As demais podem ser adicionadas depois.`);
    setError(null);
    onChange([...files, ...picked]);
  };

  const remove = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
    if (index === coverIndex) onCoverChange(0);
    else if (index < coverIndex) onCoverChange(coverIndex - 1);
  };

  return (
    <fieldset className="sm:col-span-2">
      <legend className="mb-1 text-sm font-semibold">Imagens do banner</legend>
      <p className="mb-3 text-sm text-ink-soft">JPG, PNG, WebP ou AVIF, até 5 MB cada. A capa aparece primeiro no carrossel da home.</p>
      {error && <Alert tone="error" className="mb-3">{error}</Alert>}
      <input ref={input} type="file" accept={ACCEPT} multiple className="sr-only" aria-label="Escolher imagens da campanha" onChange={(e) => onPick(e.target.files)} />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {files.map((file, i) => (
          <li key={`${file.name}-${i}`} className="overflow-hidden rounded-xl border border-sand-200">
            <div className="aspect-[16/9] bg-sand"><img src={previews[i]} alt="" className="size-full object-cover" /></div>
            <div className="flex items-center justify-between gap-1 p-2">
              <label className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold">
                <input type="radio" name="capa-campanha" checked={coverIndex === i} onChange={() => onCoverChange(i)} className="accent-oxblood-600" />
                Capa
              </label>
              <Button variant="ghost" size="sm" onClick={() => remove(i)} aria-label={`Remover ${file.name}`}><X className="size-4" aria-hidden="true" /></Button>
            </div>
          </li>
        ))}
        <li>
          <button type="button" onClick={() => input.current?.click()} className="grid aspect-[16/9] w-full cursor-pointer place-items-center rounded-xl border-2 border-dashed border-sand-200 text-center text-sm font-semibold text-ink-soft hover:border-oxblood-600 hover:text-oxblood-700 md:aspect-[16/11]">
            <span><ImagePlus className="mx-auto mb-1 size-6" aria-hidden="true" />Adicionar imagens</span>
          </button>
        </li>
      </ul>
    </fieldset>
  );
}

// ── Formulário (criar / editar) ──────────────────────────────────────────────
function CampaignForm({ campaign, onDone }: { campaign?: CampaignOut; onDone: () => void }) {
  const { update } = useCampaignActions();
  const createWithImages = useCreateCampaignWithImages();
  const [formError, setFormError] = useState<string | null>(null);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [coverIndex, setCoverIndex] = useState(0);
  const [activateNow, setActivateNow] = useState(true);
  const { register, handleSubmit, setError, formState: { errors } } = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      title: campaign?.title ?? "",
      description: campaign?.description ?? "",
      starts_at: toLocalInput(campaign?.starts_at),
      ends_at: toLocalInput(campaign?.ends_at),
    },
  });
  const pending = createWithImages.isPending || update.isPending;

  const onSubmit = handleSubmit(async (v) => {
    setFormError(null);
    const payload = {
      title: v.title,
      description: v.description || null,
      starts_at: toIso(v.starts_at),
      ends_at: toIso(v.ends_at),
    };
    try {
      if (campaign) {
        await update.mutateAsync({ id: campaign.campaign_id, ...payload });
      } else {
        const { failed } = await createWithImages.mutateAsync({ data: payload, images: newImages, coverIndex, activate: activateNow });
        if (failed.length > 0) toast.error(`Campanha criada, mas ${failed.length} imagem(ns) não subiram — ${failed.join(" | ")}. Tente de novo no card da campanha.`);
        else toast.success(newImages.length > 0 ? "Campanha criada com as imagens." : "Campanha criada.");
      }
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

      {!campaign && (
        <>
          <NewImagesPicker files={newImages} onChange={setNewImages} coverIndex={coverIndex} onCoverChange={setCoverIndex} />
          <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
            <input type="checkbox" checked={activateNow} onChange={(e) => setActivateNow(e.target.checked)} className="accent-oxblood-600" />
            Ativar agora (exibir no carrossel da home)
          </label>
        </>
      )}

      {formError && <Alert tone="error" className="sm:col-span-2">{formError}</Alert>}
      <div className="flex gap-2 sm:col-span-2">
        <Button type="submit" loading={pending}>{campaign ? "Salvar" : "Criar campanha"}</Button>
        <Button variant="ghost" onClick={onDone} disabled={pending}>Cancelar</Button>
      </div>
    </form>
  );
}

// ── Fotos de uma campanha já criada (sempre visíveis no card) ────────────────
function CampaignImages({ campaignId }: { campaignId: string }) {
  const images = useCampaignImages(campaignId, true);
  const { addImage, setCover, removeImage } = useCampaignActions();
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const onPick = async (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (input.current) input.current.value = "";
    const problem = validateImages(files);
    if (problem) return setError(problem);
    setError(null);
    const start = images.data?.length ?? 0;
    for (const [i, file] of files.entries()) {
      try {
        await addImage.mutateAsync({ id: campaignId, file, isCover: start === 0 && i === 0, displayOrder: start + i });
      } catch (e) {
        setError(`“${file.name}”: ${toUserMessage(e, "falha no envio.")}`);
      }
    }
  };

  if (images.isPending) return <Skeleton className="mt-4 h-24" />;
  if (images.isError) return <div className="mt-4"><ErrorState error={images.error} onRetry={() => void images.refetch()} retrying={images.isFetching} /></div>;

  const sorted = [...images.data].sort((a, b) => Number(b.is_cover) - Number(a.is_cover) || a.display_order - b.display_order);

  return (
    <div className="mt-4 border-t border-sand-200 pt-4">
      {error && <Alert tone="error" className="mb-3">{error}</Alert>}
      <input ref={input} type="file" accept={ACCEPT} multiple className="sr-only" aria-label="Enviar imagens da campanha" onChange={(e) => void onPick(e.target.files)} />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {sorted.map((img) => (
          <li key={img.campaign_mage_id} className="overflow-hidden rounded-xl border border-sand-200">
            <div className="aspect-[16/9] bg-sand"><img src={img.image_url} alt="" loading="lazy" className="size-full object-cover" /></div>
            <div className="flex items-center justify-between gap-1 p-2">
              {img.is_cover ? <Badge tone="success">Capa</Badge> : (
                <Button variant="ghost" size="sm" onClick={() => setCover.mutate({ imageId: img.campaign_mage_id, campaignId })} aria-label="Definir como capa"><Star className="size-4" aria-hidden="true" /></Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => removeImage.mutate({ imageId: img.campaign_mage_id, campaignId })} aria-label="Excluir imagem"><Trash2 className="size-4" aria-hidden="true" /></Button>
            </div>
          </li>
        ))}
        <li>
          <button type="button" onClick={() => input.current?.click()} className="grid aspect-[16/9] w-full cursor-pointer place-items-center rounded-xl border-2 border-dashed border-sand-200 text-center text-sm font-semibold text-ink-soft hover:border-oxblood-600 hover:text-oxblood-700 md:aspect-[16/11]">
            <span><ImagePlus className="mx-auto mb-1 size-6" aria-hidden="true" />{addImage.isPending ? "Enviando…" : "Adicionar"}</span>
          </button>
        </li>
      </ul>
      {sorted.length === 0 && <p className="mt-2 text-sm text-ink-soft">Sem imagens: a campanha não aparece no carrossel até ter pelo menos uma.</p>}
    </div>
  );
}

export default function AdminCampaignsPage() {
  const campaigns = useAdminCampaigns();
  const actions = useCampaignActions();
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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
                      <Button variant="ghost" size="sm" onClick={() => { setEditingId(c.campaign_id); setAdding(false); }} aria-label={`Editar ${c.title}`}><Pencil className="size-4" aria-hidden="true" />Editar</Button>
                      <Button variant="ghost" size="sm" onClick={() => actions.toggle.mutate({ id: c.campaign_id, active: !c.is_active })}>{c.is_active ? "Desativar" : "Ativar"}</Button>
                      <Button variant="ghost" size="sm" onClick={() => setToDelete(c)} aria-label={`Excluir ${c.title}`}><Trash2 className="size-4" aria-hidden="true" /></Button>
                    </div>
                  </div>
                  <CampaignImages campaignId={c.campaign_id} />
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Excluir campanha?"
        description={toDelete ? `“${toDelete.title}” e as imagens dela serão removidas.` : undefined}
        confirmLabel="Excluir"
        loading={actions.remove.isPending}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && actions.remove.mutate(toDelete.campaign_id, { onSettled: () => setToDelete(null) })}
      />
    </>
  );
}