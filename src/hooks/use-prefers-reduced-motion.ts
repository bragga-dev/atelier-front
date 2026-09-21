import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function getMedia(): MediaQueryList | null {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(QUERY) : null;
}

function subscribe(callback: () => void): () => void {
  const media = getMedia();
  media?.addEventListener("change", callback);
  return () => media?.removeEventListener("change", callback);
}

/** `true` quando a pessoa pediu menos animação no sistema — desligamos autoplay e movimentos. */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getMedia()?.matches ?? false,
    () => false,
  );
}