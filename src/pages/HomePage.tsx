import { Container } from "@/components/layout/Container";
import { Skeleton } from "@/components/ui/Skeleton";
import { BannerCarousel } from "@/features/campaigns/BannerCarousel";
import { useBanners } from "@/features/campaigns/queries";
import { Highlights } from "@/features/home/Highlights";
import { HomeCategories } from "@/features/home/HomeCategories";
import { HomeNewProducts } from "@/features/home/HomeNewProducts";
import { StaticHero } from "@/features/home/StaticHero";

export default function HomePage() {
  const { isPending, banners } = useBanners();

  return (
    <>
      <section className="py-6 sm:py-10">
        <Container>
          {isPending ? (
            <Skeleton className="aspect-[16/9] rounded-[var(--radius-card)] md:aspect-[21/8]" />
          ) : banners.length > 0 ? (
            <>
              {/* O carrossel só tem imagens; o h1 da página fica oculto para leitores de tela. */}
              <h1 className="sr-only">Sol e Arte — artesanato com alma</h1>
              <BannerCarousel banners={banners} />
            </>
          ) : (
            <StaticHero />
          )}
        </Container>
      </section>

      <Highlights />
      <HomeCategories />
      <HomeNewProducts />
    </>
  );
}