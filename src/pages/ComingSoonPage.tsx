import { Hammer } from "lucide-react";
import { Link } from "react-router";
import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/button-styles";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Marcador de rota das próximas fases do projeto. Não simula dados: só avisa que a tela
 * ainda não foi implementada.
 */
export default function ComingSoonPage({ title, phase }: { title: string; phase: string }) {
  return (
    <Container className="py-16">
      <EmptyState
        icon={<Hammer className="size-7" aria-hidden="true" />}
        title={title}
        description={`Esta tela será entregue em: ${phase}.`}
        action={
          <Link to="/" className={buttonStyles({ variant: "outline" })}>
            Voltar ao início
          </Link>
        }
      />
    </Container>
  );
}
