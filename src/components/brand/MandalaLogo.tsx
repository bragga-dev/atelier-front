import logo640 from "@/assets/logo-mandala-640.webp";
import logo1000 from "@/assets/logo-mandala-1000.webp";
import { cn } from "@/lib/cn";

interface MandalaLogoProps {
  className?: string;
  /** Dica de largura renderizada, para o navegador escolher o arquivo certo. */
  sizes?: string;
  priority?: boolean;
}

/**
 * Logo oficial (mandala). O fundo da imagem é #f1e1cd — o mesmo token `parchment` —, então
 * ela se funde a qualquer bloco `bg-parchment`.
 */
export function MandalaLogo({ className, sizes = "(min-width: 1024px) 520px, 90vw", priority = false }: MandalaLogoProps) {
  return (
    <img
      src={logo1000}
      srcSet={`${logo640} 640w, ${logo1000} 1000w`}
      sizes={sizes}
      width={1000}
      height={1000}
      alt="Logo Sol e Arte — artesanato com alma"
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      className={cn("h-auto w-full select-none", className)}
    />
  );
}
