import { CreditCard, HandHeart, MessageCircle, type LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { MandalaLogo } from "@/components/brand/MandalaLogo";
import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/button-styles";

const HIGHLIGHTS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: HandHeart, title: "Feito à mão", text: "Peças artesanais com identidade" },
  { icon: CreditCard, title: "Pix, boleto ou cartão", text: "Você escolhe como pagar" },
  { icon: MessageCircle, title: "Atendimento pelo chat", text: "Tire dúvidas direto com a loja" },
];

export default function HomePage() {
  return (
    <>
      <section className="py-6 sm:py-10">
        <Container>
          <div className="overflow-hidden rounded-[var(--radius-card)] bg-parchment shadow-card">
            <div className="grid items-center lg:grid-cols-[1.05fr_1fr]">
              <div className="px-6 pb-2 pt-10 sm:px-12 sm:pt-14 lg:py-20 lg:pl-16 lg:pr-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-oxblood-700">
                  Artesanato com alma
                </p>
                <h1 className="mt-4 text-5xl font-semibold leading-[1.02] sm:text-6xl lg:text-7xl">
                  Peças feitas à mão, com tradição e cuidado.
                </h1>
                <p className="mt-5 max-w-md text-lg text-ink-soft">
                  Objetos únicos de artesanato para deixar a sua casa e os seus dias mais bonitos.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link to="/produtos" className={buttonStyles({ size: "lg" })}>
                    Ver produtos
                  </Link>
                  <Link to="/contato" className={buttonStyles({ size: "lg", variant: "outline" })}>
                    Falar com a loja
                  </Link>
                </div>
              </div>

              <div className="flex justify-center px-6 pb-8 pt-4 lg:p-8">
                <MandalaLogo priority className="max-w-[24rem] lg:max-w-[32rem]" />
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section aria-label="Diferenciais" className="py-6">
        <Container>
          <ul className="grid gap-6 border-y border-sand-200 py-8 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-sand-200">
            {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex items-center gap-4 sm:justify-center sm:px-6">
                <span className="grid size-12 shrink-0 place-items-center rounded-full border border-gold-500/50 bg-parchment text-oxblood-600">
                  <Icon className="size-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block font-semibold">{title}</span>
                  <span className="block text-sm text-ink-soft">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
