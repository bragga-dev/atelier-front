// frontend/src/features/home/FallbackCarousel.tsx
import { Link } from "react-router";
import { MandalaLogo } from "@/components/brand/MandalaLogo";
import { buttonStyles } from "@/components/ui/button-styles";
import { Carousel, type CarouselLabels } from "@/features/campaigns/Carousel";
import { cn } from "@/lib/cn";

interface HeroSlideProps {
  eyebrow: string;
  title: string;
  text: string;
  primary: { label: string; to: string };
  secondary?: { label: string; to: string };
  /** O primeiro slide carrega o h1 da página; os demais usam h2. */
  heading: "h1" | "h2";
  mandalaFirst?: boolean;
  priority?: boolean;
}

function HeroSlide({ eyebrow, title, text, primary, secondary, heading: Heading, mandalaFirst, priority }: HeroSlideProps) {
  return (
    <div className="grid h-full items-center lg:grid-cols-[1.05fr_1fr]">
      <div className={cn("px-6 pb-4 pt-10 sm:px-12 sm:pt-14 lg:py-16 lg:pl-16 lg:pr-6", mandalaFirst && "lg:order-2 lg:pl-6 lg:pr-16")}>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oxblood-700">{eyebrow}</p>
        <Heading className="mt-4 text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">{title}</Heading>
        <p className="mt-5 max-w-md text-lg text-ink-soft">{text}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={primary.to} className={buttonStyles({ size: "lg" })}>
            {primary.label}
          </Link>
          {secondary && (
            <Link to={secondary.to} className={buttonStyles({ size: "lg", variant: "outline" })}>
              {secondary.label}
            </Link>
          )}
        </div>
      </div>

      <div className={cn("flex justify-center px-6 pb-14 pt-2 lg:p-8", mandalaFirst && "lg:order-1")}>
        <MandalaLogo priority={priority} className="max-w-[16rem] lg:max-w-[26rem]" />
      </div>
    </div>
  );
}

const LABELS: CarouselLabels = {
  prev: "Slide anterior",
  next: "Próximo slide",
  goTo: (position) => `Ir para o slide ${position}`,
};

/**
 * Carrossel padrão da home — usado quando não há campanha vigente com banner.
 * Mesmo comportamento do carrossel de campanhas (autoplay, setas, bolinhas, pausa).
 */
export function FallbackCarousel() {
  return (
    <Carousel
      label="Destaques da loja"
      labels={LABELS}
      slideClassName="min-h-[34rem] sm:min-h-[36rem] lg:min-h-[28rem]"
      slides={[
        {
          id: "marca",
          content: (
            <HeroSlide
              heading="h1"
              priority
              eyebrow="Artesanato com alma"
              title="Peças feitas à mão, com tradição e cuidado."
              text="Objetos únicos de artesanato para deixar a sua casa e os seus dias mais bonitos."
              primary={{ label: "Ver produtos", to: "/produtos" }}
              secondary={{ label: "Falar com a loja", to: "/contato" }}
            />
          ),
        },
        {
          id: "novidades",
          content: (
            <HeroSlide
              heading="h2"
              mandalaFirst
              eyebrow="Novidades do ateliê"
              title="Cada peça é única, feita com tempo e carinho."
              text="Veja o que acabou de chegar e escolha a sua."
              primary={{ label: "Ver novidades", to: "/produtos?ordem=recentes" }}
            />
          ),
        },
        {
          id: "contato",
          content: (
            <HeroSlide
              heading="h2"
              eyebrow="Fale com a gente"
              title="Dúvidas sobre peças, prazos ou pedidos?"
              text="Mande uma mensagem e a loja responde o quanto antes."
              primary={{ label: "Falar com a loja", to: "/contato" }}
            />
          ),
        },
      ]}
    />
  );
}