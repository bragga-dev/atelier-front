import { Outlet, ScrollRestoration } from "react-router";
import { ToastViewport } from "@/components/ui/ToastViewport";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { NavigationProgress } from "./NavigationProgress";

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:font-semibold focus:text-cream"
      >
        Ir para o conteúdo
      </a>

      <NavigationProgress />
      <Header />

      <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>

      <Footer />
      <ToastViewport />
      <ScrollRestoration />
    </div>
  );
}
