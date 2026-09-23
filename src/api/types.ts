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
export type CartItemOut = Schemas["CartItemOut"];
export type CartItemCreateIn = Schemas["CartItemCreateIn"];
export type CartItemUpdateIn = Schemas["CartItemUpdateIn"];

// Notificações
export type UnreadCountOut = Schemas["UnreadCountOut"];

// Produtos
export type ProductListOut = Schemas["ProductListOut"];
export type ProductOut = Schemas["ProductOut"];
export type ProductPage = Schemas["PageOut_ProductListOut_"];
export type ProductImageOut = Schemas["ImageOut"];

// Avaliações
export type ReviewOut = Schemas["ReviewsOut"];
export type ProductRatingSummaryOut = Schemas["ProductRatingSummaryOut"];

// Frete (Frenet)
export type ShippingQuoteIn = Schemas["ShippingQuoteIn"];
export type ShippingOptionOut = Schemas["FrenetShippingOptionOut"];

// Campanhas (banners da home)
export type CampaignOut = Schemas["CampaignOut"];
export type CampaignImageOut = Schemas["CampaignImageOut"];

// Contato
export type ContactCreateIn = Schemas["ContactCreateIn"];
export type ContactOut = Schemas["ContactOut"];