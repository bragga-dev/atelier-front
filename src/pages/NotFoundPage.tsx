import { Compass } from "lucide-react";
import { Link } from "react-router";
import { Container } from "@/components/layout/Container";
import { buttonStyles } from "@/components/ui/button-styles";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFoundPage() {
  return (
    <Container className="py-16">
      <EmptyState
        icon={<Compass className="size-7" aria-hidden="true" />}
        title="Página não encontrada"
        description="O endereço que você tentou abrir não existe ou foi movido."
        action={
          <Link to="/" className={buttonStyles()}>
            Ir para o início
          </Link>
        }
      />
    </Container>
  );
}
