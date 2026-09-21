import type { components } from "./schema";

/**
 * Aliases legíveis sobre os tipos gerados do OpenAPI (`schema.d.ts`).
 * Regenerar com `npm run gen:api` sempre que o backend mudar.
 */
type Schemas = components["schemas"];

// Auth
export type LoginIn = Schemas["LoginIn"];
export type RegisterIn = Schemas["RegisterIn"];
export type AccessTokenOut = Schemas["AccessTokenOut"];
export type PasswordResetRequestIn = Schemas["PasswordResetRequestIn"];
export type PasswordResetConfirmIn = Schemas["PasswordResetConfirmIn"];
export type MessageOut = Schemas["MessageOut"];
export type MeOut = Schemas["MeOut"];
export type UserOut = Schemas["UserOut"];
export type ClientProfileOut = Schemas["ClientProfileOut"];

// Catálogo
export type CategoryOut = Schemas["ProductCategoryOut"];
export type CategoryPage = Schemas["PageOut_ProductCategoryOut_"];

// Carrinho
export type CartOut = Schemas["CartOut"];

// Notificações
export type UnreadCountOut = Schemas["UnreadCountOut"];
