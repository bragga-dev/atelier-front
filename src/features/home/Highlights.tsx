import { CreditCard, HandHeart, MessageCircle, type LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/Container";

const HIGHLIGHTS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: HandHeart, title: "Feito à mão", text: "Peças artesanais com identidade" },
  { icon: CreditCard, title: "Pix, boleto ou cartão", text: "Você escolhe como pagar" },
  { icon: MessageCircle, title: "Atendimento pelo chat", text: "Tire dúvidas direto com a loja" },
];

export function Highlights() {
  return (
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
  );
}