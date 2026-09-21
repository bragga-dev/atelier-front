import { isRouteErrorResponse, useRouteError } from "react-router";
import { Container } from "@/components/layout/Container";
import { ErrorState } from "@/components/ui/ErrorState";

/** Último recurso: erro inesperado ao renderizar/carregar uma rota. Nunca mostra o stack ao usuário. */
export default function RouteErrorPage() {
  const error = useRouteError();

  if (import.meta.env.DEV) console.error(error);

  const notFound = isRouteErrorResponse(error) && error.status === 404;

  return (
    <Container className="py-16">
      <ErrorState
        title={notFound ? "Página não encontrada" : "Algo deu errado"}
        message={
          notFound
            ? "O endereço que você tentou abrir não existe."
            : "Tivemos um problema ao carregar esta tela. Recarregue a página e tente novamente."
        }
        onRetry={() => window.location.reload()}
      />
    </Container>
  );
}
