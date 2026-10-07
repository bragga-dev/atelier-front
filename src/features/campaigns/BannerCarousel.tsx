// frontend/src/features/campaigns/BannerCarousel.tsx
import { Carousel } from "./Carousel";
import type { Banner } from "./queries";

/** Carrossel dos banners das campanhas vigentes (imagens enviadas no admin). */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  return (
    <Carousel
      label="Destaques da loja"
      slideClassName="aspect-[16/9] md:aspect-[21/8]"
      slides={banners.map((banner, i) => ({
        id: banner.id,
        content: (
          <img
            src={banner.url}
            alt={banner.alt}
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : "auto"}
            decoding="async"
            className="size-full object-cover"
          />
        ),
      }))}
    />
  );
}