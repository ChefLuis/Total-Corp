/** "1.234,56" | "1234.56" | "80" → centavos. Retorna null se inválido. */
export function parseMoneyToCents(input: string): number | null {
  const s = (input || '').trim().replace(/[R$\s]/g, '');
  if (!s) return null;
  const normalized = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(parseFloat(normalized) * 100);
}

export const centsToInput = (cents: number) => (cents / 100).toFixed(2).replace('.', ',');
