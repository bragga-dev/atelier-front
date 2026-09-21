import { useEffect, type RefObject } from "react";

/**
 * Fecha popovers/menus ao clicar fora ou apertar Escape.
 * `containerRef` deve envolver o botão gatilho E o painel (clique no gatilho não conta como "fora").
 */
export function useDismissable(
  open: boolean,
  onDismiss: () => void,
  containerRef: RefObject<HTMLElement | null>,
): void {
  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) onDismiss();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onDismiss();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onDismiss, containerRef]);
}
