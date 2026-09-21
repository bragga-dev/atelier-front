import type { ReactNode } from "react";
import { MandalaLogo } from "@/components/brand/MandalaLogo";
import { Container } from "@/components/layout/Container";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

/** Moldura das telas de autenticação: logo (desktop) + cartão com o formulário. */
export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <Container className="py-8 sm:py-12 lg:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[var(--radius-card)] border border-sand-200 bg-white shadow-card lg:grid-cols-2">
        <div className="hidden items-center justify-center bg-parchment p-6 lg:flex">
          <MandalaLogo sizes="(min-width: 1024px) 460px, 0px" />
        </div>

        <div className="p-6 sm:p-10">
          <h1 className="text-4xl font-semibold">{title}</h1>
          {subtitle && <p className="mt-2 text-ink-soft">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-ink-soft">{footer}</div>}
        </div>
      </div>
    </Container>
  );
}
