import type { MeOut } from "@/api/types";

/** Nome para exibir: primeiro nome do perfil, senão a parte local do e-mail. */
export function displayName(me: MeOut): string {
  const firstName = me.client?.first_name?.trim();
  if (firstName) return firstName;
  return me.user.email.split("@")[0] ?? me.user.email;
}
