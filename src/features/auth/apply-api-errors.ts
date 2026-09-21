import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { isApiError, toUserMessage } from "@/api/errors";

/**
 * Trata um erro de envio de formulário:
 *  - erros de validação do backend (422) vão para os campos correspondentes;
 *  - retorna a mensagem para o alerta do topo do formulário — ou `null` quando tudo
 *    já foi mostrado nos campos (evita repetir a mesma mensagem duas vezes).
 */
export function applyApiErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  fallbackMessage?: string,
): string | null {
  if (isApiError(error) && Object.keys(error.fieldErrors).length > 0) {
    let leftover: string | null = null;
    for (const [key, message] of Object.entries(error.fieldErrors)) {
      if ((fields as readonly string[]).includes(key)) {
        setError(key as Path<T>, { type: "server", message });
      } else {
        leftover = message; // erro sem campo próprio (ex.: validação do model)
      }
    }
    return leftover;
  }
  return toUserMessage(error, fallbackMessage);
}
