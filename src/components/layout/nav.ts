/** Abas fixas da navbar. "Categorias" é um menu à parte (alimentado pela API). */
export interface NavItem {
  label: string;
  to: string;
  end?: boolean;
}

export const NAV_BEFORE_CATEGORIES: NavItem[] = [{ label: "Início", to: "/", end: true }];

export const NAV_AFTER_CATEGORIES: NavItem[] = [
  { label: "Produtos", to: "/produtos" },
  { label: "Contato", to: "/contato" },
];
