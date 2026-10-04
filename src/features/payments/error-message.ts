import { isApiError, toUserMessage } from "@/api/errors";

/**
 * A criação de cobrança relaia a Asaas: uma recusa de cartão ou um CPF rejeitado volta como
 * `502` (a Asaas respondeu com erro), mas a mensagem é a descrição que a própria Asaas devolve —
 * segura e pensada para o cliente final, ao contrário de um 502 genérico de infraestrutura.
 * Por isso aqui — e só aqui — usamos o `detail` de um 502, com uma rede de segurança: se ele
 * carregar o texto de depuração do backend ("sem corpo de resposta"), caímos na mensagem genérica.
 */
export function paymentErrorMessage(error: unknown, fallback: string): string {
  if (isApiError(error) && error.status === 502 && error.detail && !error.detail.includes("Veja o log")) {
    return error.detail;
  }
  return toUserMessage(error, fallback);
}