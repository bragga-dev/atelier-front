import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { toUserMessage } from "@/api/errors";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/auth-context";
import { fullName, userPhotoUrl } from "@/features/auth/display-name";
import { useProfilePhoto } from "../hooks";

const MAX_BYTES = 5 * 1024 * 1024; // limite do backend (5 MB)
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function PhotoUploader() {
  const { me } = useAuth();
  const { upload, remove } = useProfilePhoto();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  if (!me) return null;

  const photo = userPhotoUrl(me);

  const onPick = (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!ALLOWED.includes(file.type)) return setError("Use uma imagem JPG, PNG ou WebP.");
    if (file.size > MAX_BYTES) return setError("A imagem deve ter no máximo 5 MB.");
    upload.mutate(file, { onError: (e) => setError(toUserMessage(e, "Não foi possível enviar a foto.")) });
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="flex flex-wrap items-center gap-5">
      <Avatar src={photo} name={fullName(me)} size="xl" />
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <input ref={inputRef} id="foto-perfil" type="file" accept={ALLOWED.join(",")} className="sr-only" onChange={(e) => onPick(e.target.files?.[0])} />
          <label htmlFor="foto-perfil" className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border border-ink/30 px-4 text-xs font-semibold uppercase tracking-[0.08em] hover:border-oxblood-600 hover:text-oxblood-700">
            <Camera className="size-4" aria-hidden="true" />
            {upload.isPending ? "Enviando…" : photo ? "Trocar foto" : "Enviar foto"}
          </label>
          {photo && (
            <Button variant="ghost" size="sm" onClick={() => remove.mutate()} loading={remove.isPending}>
              <Trash2 className="size-4" aria-hidden="true" />
              Remover
            </Button>
          )}
        </div>
        <p className="text-xs text-ink-soft">JPG, PNG ou WebP, até 5 MB.</p>
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    </div>
  );
}