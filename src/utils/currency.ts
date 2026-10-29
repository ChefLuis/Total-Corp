export function formatCurrency(cents: number, locale = 'pt-BR', currency = 'BRL'): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount);
  } catch {
    return `R$ ${amount.toFixed(2).replace('.', ',')}`;
  }
}
