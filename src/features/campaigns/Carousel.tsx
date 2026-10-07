// frontend/src/features/campaigns/Carousel.tsx
import { useEffect, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { cn } from "@/lib/cn";

const AUTOPLAY_MS = 6000;

const ARROW =
  "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-cream/90 text-ink shadow-card hover:bg-cream";

export interface CarouselSlide {
  id: string;
  content: ReactNode;
}

export interface CarouselLabels {
  prev: string;
  next: string;
  goTo: (position: number) => string;
}

const BANNER_LABELS: CarouselLabels = {
  prev: "Banner anterior",
  next: "Próximo banner",
  goTo: (position) => `Ir para o banner ${position}`,
};

interface CarouselProps {
  slides: CarouselSlide[];
  /** Nome acessível da região do carrossel. */
  label: string;
  /** Classes de cada slide (ex.: proporção fixa para banners). */
  slideClassName?: string;
  labels?: CarouselLabels;
}

/**
 * Carrossel genérico: setas, bolinhas, autoplay (pausa no hover/foco e por botão) e
 * respeito a "reduzir movimento". Slides fora de vista ficam `inert` (sem foco/leitura).
 */
export function Carousel({ slides, label, slideClassName, labels = BANNER_LABELS }: CarouselProps) {
  const count = slides.length;
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
      aria-label={label}
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
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${count}`}
            aria-hidden={i !== current}
            inert={i !== current}
            className={cn("w-full shrink-0", slideClassName)}
          >
            {slide.content}
          </div>
        ))}
      </div>

      {count > 1 && (
        <>
          <button type="button" aria-label={labels.prev} onClick={() => go(current - 1)} className={cn(ARROW, "left-3")}>
            <ChevronLeft className="size-6" aria-hidden="true" />
          </button>
          <button type="button" aria-label={labels.next} onClick={() => go(current + 1)} className={cn(ARROW, "right-3")}>
            <ChevronRight className="size-6" aria-hidden="true" />
          </button>

          <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-3">
            <ul className="flex items-center gap-2 rounded-full bg-espresso/50 px-3 py-2">
              {slides.map((slide, i) => (
                <li key={slide.id}>
                  <button
                    type="button"
                    aria-label={labels.goTo(i + 1)}
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