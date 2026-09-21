import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";
import type { Banner } from "./queries";

const AUTOPLAY_MS = 6000;

const ARROW =
  "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-cream/90 text-ink shadow-card hover:bg-cream";

/** Carrossel dos banners das campanhas. Autoplay pausa no hover/foco, tem botão de pausa e respeita "reduzir movimento". */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const count = banners.length;
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  const current = Math.min(index, count - 1);
  const autoplay = count > 1 && !userPaused && !interacting && !reducedMotion;

  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [autoplay, count]);

  const go = (target: number) => setIndex((target + count) % count);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Destaques da loja"
      className="relative overflow-hidden rounded-[var(--radius-card)] bg-parchment shadow-card"
      onPointerEnter={() => setInteracting(true)}
      onPointerLeave={() => setInteracting(false)}
      onFocus={() => setInteracting(true)}
      onBlur={() => setInteracting(false)}
    >
      <div
        className={cn("flex", !reducedMotion && "transition-transform duration-700 ease-out")}
        style={{ transform: `translateX(-${current * 100}%)` }}
        aria-live={autoplay ? "off" : "polite"}
      >
        {banners.map((banner, i) => (
          <div
            key={banner.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${count}`}
            aria-hidden={i !== current}
            className="aspect-[16/9] w-full shrink-0 md:aspect-[21/8]"
          >
            <img
              src={banner.url}
              alt={banner.alt}
              loading={i === 0 ? "eager" : "lazy"}
              fetchPriority={i === 0 ? "high" : "auto"}
              decoding="async"
              className="size-full object-cover"
            />
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button type="button" aria-label="Banner anterior" onClick={() => go(current - 1)} className={cn(ARROW, "left-3")}>
            <ChevronLeft className="size-6" aria-hidden="true" />
          </button>
          <button type="button" aria-label="Próximo banner" onClick={() => go(current + 1)} className={cn(ARROW, "right-3")}>
            <ChevronRight className="size-6" aria-hidden="true" />
          </button>

          <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-3">
            <ul className="flex items-center gap-2 rounded-full bg-espresso/50 px-3 py-2">
              {banners.map((banner, i) => (
                <li key={banner.id}>
                  <button
                    type="button"
                    aria-label={`Ir para o banner ${i + 1}`}
                    aria-current={i === current ? "true" : undefined}
                    onClick={() => go(i)}
                    className={cn("block h-2 rounded-full transition-all", i === current ? "w-6 bg-gold-400" : "w-2 bg-cream/70 hover:bg-cream")}
                  />
                </li>
              ))}
            </ul>
            {!reducedMotion && (
              <button
                type="button"
                onClick={() => setUserPaused((paused) => !paused)}
                aria-label={userPaused ? "Retomar rotação automática" : "Pausar rotação automática"}
                className="grid size-8 place-items-center rounded-full bg-espresso/50 text-cream hover:bg-espresso/70"
              >
                {userPaused ? <Play className="size-4" aria-hidden="true" /> : <Pause className="size-4" aria-hidden="true" />}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}