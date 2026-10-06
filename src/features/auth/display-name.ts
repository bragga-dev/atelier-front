import type { MeOut } from "@/api/types";
import { safeExternalUrl } from "@/lib/safe-url";

/** Nome para exibir: primeiro nome do perfil (cliente), nome do admin, senão a parte local do e-mail. */
export function displayName(me: MeOut): string {
  const firstName = me.client?.first_name?.trim();
  if (firstName) return firstName;
  const adminName = me.admin?.full_name?.trim();
  if (adminName) return adminName.split(/\s+/)[0]!;
  return me.user.email.split("@")[0] ?? me.user.email;
}

/** Nome completo (ou o e-mail, se o perfil ainda não tem nome). */
export function fullName(me: MeOut): string {
  const client = me.client;
  const joined = [client?.first_name, client?.last_name].filter(Boolean).join(" ").trim();
  return joined || me.admin?.full_name?.trim() || me.user.email;
}

/** Foto do perfil (cliente ou admin), só se for uma URL segura; senão `null` (cai nas iniciais). */
export function userPhotoUrl(me: MeOut): string | null {
  return safeExternalUrl(me.client?.photo_url ?? me.admin?.photo_url);
}

export function isAdminUser(me: MeOut | null | undefined): boolean {
  return me?.user.role === "admin";
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]![0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]![0] ?? "") : "";
  return (first + last).toUpperCase();
}