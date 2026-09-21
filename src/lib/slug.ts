/** "Tapete de Crochê Aspiral" → "tapete-de-croche-aspiral". A API só usa o UUID; o slug é cosmético (URL legível). */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function productPath(product: { product_id: string; product_name: string }): string {
  const slug = slugify(product.product_name);
  return slug ? `/produtos/${product.product_id}/${slug}` : `/produtos/${product.product_id}`;
}