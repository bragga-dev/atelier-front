import { useSyncExternalStore } from "react";

export type ToastKind = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const AUTO_DISMISS_MS = 5000;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function dismiss(id: number): void {
  items = items.filter((item) => item.id !== id);
  emit();
}

function push(kind: ToastKind, message: string): void {
  // Evita empilhar a mesma mensagem repetida (ex.: várias queries falhando juntas).
  if (items.some((item) => item.kind === kind && item.message === message)) return;
  const id = nextId++;
  items = [...items, { id, kind, message }];
  emit();
  window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
}

/** API imperativa: pode ser chamada de qualquer lugar (inclusive fora do React). */
export const toast = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
  info: (message: string) => push("info", message),
  dismiss,
};

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useToasts(): ToastItem[] {
  return useSyncExternalStore(subscribe, () => items);
}
