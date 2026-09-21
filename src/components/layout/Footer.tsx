import { Link } from "react-router";
import { useAuth } from "@/features/auth/auth-context";
import { Logo } from "@/components/brand/Logo";
import { Container } from "./Container";

const linkClass = "text-cream/75 transition-colors hover:text-gold-300 hover:underline";
const headingClass = "font-sans text-xs font-semibold uppercase tracking-[0.22em] text-gold-300";

export function Footer() {
  const { isAuthenticated } = useAuth();

  return (
    <footer className="mt-20 border-t-4 border-gold-500 bg-espresso text-cream">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo tone="light" />
          <p className="mt-5 max-w-xs text-cream/75">Peças artesanais feitas com tradição, cuidado e alma.</p>
        </div>

        <nav aria-label="Loja">
          <h2 className={headingClass}>Loja</h2>
          <ul className="mt-4 space-y-2.5">
            <li><Link to="/" className={linkClass}>Início</Link></li>
            <li><Link to="/produtos" className={linkClass}>Produtos</Link></li>
            <li><Link to="/categorias" className={linkClass}>Categorias</Link></li>
          </ul>
        </nav>

        <nav aria-label="Atendimento">
          <h2 className={headingClass}>Atendimento</h2>
          <ul className="mt-4 space-y-2.5">
            <li><Link to="/contato" className={linkClass}>Contato</Link></li>
            <li><Link to="/chat" className={linkClass}>Chat com a loja</Link></li>
          </ul>
        </nav>

        <nav aria-label="Minha conta">
          <h2 className={headingClass}>Minha conta</h2>
          <ul className="mt-4 space-y-2.5">
            {isAuthenticated ? (
              <>
                <li><Link to="/painel" className={linkClass}>Meus dados</Link></li>
                <li><Link to="/painel/meus-pedidos" className={linkClass}>Meus pedidos</Link></li>
              </>
            ) : (
              <>
                <li><Link to="/entrar" className={linkClass}>Entrar</Link></li>
                <li><Link to="/cadastro" className={linkClass}>Criar conta</Link></li>
              </>
            )}
          </ul>
        </nav>
      </Container>

      <div className="border-t border-cream/15">
        <Container className="py-5 text-sm text-cream/60">
          © {new Date().getFullYear()} Sol e Arte. Todos os direitos reservados.
        </Container>
      </div>
    </footer>
  );
}
