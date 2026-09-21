import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router/dom";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/cormorant-garamond";
import "./index.css";
import { AppProviders } from "./app/providers";
import { createAppRouter } from "./app/router";

const router = createAppRouter();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
