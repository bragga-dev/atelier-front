/**
 * Erros da API em um formato único. O backend responde:
 *  - `{ "detail": "mensagem" }` na maioria dos erros (400/401/403/404/409/429/5xx);
 *  - `{ "detail": [{ "loc": [...], "msg": "...", "type": "..." }] }` em 422 (validação).
 */
export type ApiErrorKind = "network" | "timeout" | "http";

export type ApiFieldErrors = Record<string, string>;

interface ApiErrorInit {
  kind: ApiErrorKind;
  status: number;
  message: string;
  detail?: string | null;
  fieldErrors?: ApiFieldErrors;
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  /** Status HTTP (0 quando não houve resposta: rede/timeout). */
  readonly status: number;
  /** Mensagem do backend quando ela é uma string legível. */
  readonly detail: string | null;
  /** Erros por campo (422), já com a mensagem traduzida/limpa. */
  readonly fieldErrors: ApiFieldErrors;

  constructor(init: ApiErrorInit) {
    super(init.message);
    this.name = "ApiError";
    this.kind = init.kind;
    this.status = init.status;
    this.detail = init.detail ?? null;
    this.fieldErrors = init.fieldErrors ?? {};
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

interface ValidationItem {
  loc?: unknown;
  msg?: unknown;
  type?: unknown;
  ctx?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function cleanValidationMessage(item: ValidationItem): string {
  const msg = typeof item.msg === "string" ? item.msg : "";
  const type = typeof item.type === "string" ? item.type : "";

  if (type === "missing") return "Campo obrigatório.";
  if (type === "string_too_short" && isRecord(item.ctx) && typeof item.ctx.min_length === "number") {
    return `Use pelo menos ${item.ctx.min_length} caracteres.`;
  }
  if (/valid email/i.test(msg)) return "Informe um e-mail válido.";
  // Pydantic prefixa erros de validators customizados com "Value error, ".
  return msg.replace(/^Value error,\s*/i, "") || "Valor inválido.";
}

function parseValidationErrors(detail: unknown[]): ApiFieldErrors {
  const fields: ApiFieldErrors = {};
  for (const raw of detail) {
    if (!isRecord(raw)) continue;
    const item = raw as ValidationItem;
    const loc = Array.isArray(item.loc) ? item.loc : [];
    const field = [...loc].reverse().find((part): part is string => typeof part === "string");
    // Validações de model (ex.: senhas diferentes) não têm campo próprio → "_form".
    const key = field && field !== "payload" && field !== "body" ? field : "_form";
    if (!(key in fields)) fields[key] = cleanValidationMessage(item);
  }
  return fields;
}

export async function apiErrorFromResponse(response: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    // Corpo vazio ou não-JSON (ex.: página HTML de um proxy 502).
  }

  const detail = isRecord(body) ? body.detail : undefined;

  if (typeof detail === "string") {
    return new ApiError({ kind: "http", status: response.status, message: detail, detail });
  }
  if (Array.isArray(detail)) {
    return new ApiError({
      kind: "http",
      status: response.status,
      message: `HTTP ${response.status}`,
      fieldErrors: parseValidationErrors(detail),
    });
  }
  return new ApiError({ kind: "http", status: response.status, message: `HTTP ${response.status}` });
}

const MESSAGES = {
  network: "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.",
  timeout: "O servidor demorou demais para responder. Tente novamente.",
  server: "Algo deu errado do nosso lado. Tente novamente em instantes.",
  tooMany: "Muitas tentativas em pouco tempo. Aguarde um pouco e tente novamente.",
  validation: "Confira os dados informados e tente novamente.",
  unauthorized: "Sua sessão expirou. Entre novamente para continuar.",
  forbidden: "Você não tem permissão para fazer isso.",
  notFound: "Não encontramos o que você procurava.",
  generic: "Não foi possível concluir a ação. Tente novamente.",
} as const;

/** Mensagem segura e amigável para mostrar ao usuário (nunca expõe detalhes técnicos). */
export function toUserMessage(error: unknown, fallback: string = MESSAGES.generic): string {
  if (!isApiError(error)) return fallback;
  if (error.kind === "network") return MESSAGES.network;
  if (error.kind === "timeout") return MESSAGES.timeout;
  if (error.status >= 500) return MESSAGES.server;
  if (error.status === 422) {
    return Object.values(error.fieldErrors)[0] ?? MESSAGES.validation;
  }
  if (error.detail) return error.detail;
  if (error.status === 429) return MESSAGES.tooMany;
  if (error.status === 401) return MESSAGES.unauthorized;
  if (error.status === 403) return MESSAGES.forbidden;
  if (error.status === 404) return MESSAGES.notFound;
  return fallback;
}

/** Erros que não valem retry automático (o resultado não muda se repetir). */
export function isClientError(error: unknown): boolean {
  return isApiError(error) && error.status >= 400 && error.status < 500 && error.status !== 429;
}
