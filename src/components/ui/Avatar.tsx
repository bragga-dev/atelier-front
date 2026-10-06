import { useEffect, useState } from "react";
import { initialsOf } from "@/features/auth/display-name";
import { cn } from "@/lib/cn";

const SIZES = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-16 text-xl", xl: "size-28 text-3xl" } as const;

interface AvatarProps {
  /** URL da foto; se faltar ou falhar ao carregar, mostra as iniciais. */
  src?: string | null;
  name: string;
  size?: keyof typeof SIZES;
  className?: string;
}

/** Foto redonda do usuário com fallback para iniciais (foto ausente ou quebrada). */
export function Avatar({ src, name, size = "md", className }: AvatarProps) {
  const [failed, setFailed] = useState(false);

  // Trocou a foto (upload/remoção): tenta carregar de novo.
  useEffect(() => setFailed(false), [src]);

  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-oxblood-100 font-semibold text-oxblood-700",
        SIZES[size],
        className,
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={`Foto de ${name}`}
          className="size-full object-cover"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{initialsOf(name)}</span>
      )}
    </span>
  );
}