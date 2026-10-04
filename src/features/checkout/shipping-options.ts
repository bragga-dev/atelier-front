import type { ShippingOptionOut } from "@/api/types";

/** Uma opção de envio para o carrinho inteiro (mesmo serviço disponível em todos os itens). */
export interface CartShippingChoice {
  code: string;
  carrier: string;
  service: string;
  /** Em centavos, para somar sem erro de ponto flutuante. */
  priceCents: number;
  /** O prazo do carrinho é o do item mais demorado. */
  days: number;
}

const toCents = (value: string | number): number => Math.round(Number(value) * 100);

/**
 * A API só cota frete POR PRODUTO. Para o carrinho, oferecemos os serviços (`service_code`) que atendem
 * TODOS os itens: o preço é a soma das cotações e o prazo é o maior. É uma estimativa — o backend
 * ainda não recalcula o frete do pedido inteiro.
 */
export function combineShippingQuotes(quotesPerItem: ShippingOptionOut[][]): CartShippingChoice[] {
  if (quotesPerItem.length === 0) return [];

  const valid = quotesPerItem.map((quotes) =>
    quotes.filter((quote): quote is ShippingOptionOut & { service_code: string } => !quote.error && Boolean(quote.service_code)),
  );

  const [first, ...rest] = valid;
  const choices: CartShippingChoice[] = [];

  for (const option of first ?? []) {
    const matches = rest.map((quotes) => quotes.find((quote) => quote.service_code === option.service_code));
    if (matches.some((match) => match === undefined)) continue;

    const all = [option, ...(matches as ShippingOptionOut[])];
    choices.push({
      code: option.service_code,
      carrier: option.carrier,
      service: option.service,
      priceCents: all.reduce((sum, quote) => sum + toCents(quote.price), 0),
      days: Math.max(...all.map((quote) => quote.delivery_time_days)),
    });
  }

  return choices.sort((a, b) => a.priceCents - b.priceCents || a.days - b.days);
}