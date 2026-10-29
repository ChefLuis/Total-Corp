export const onlyDigits = (v: string) => (v || '').replace(/\D/g, '');

/** (41) 99123-4567 · aceita número já formatado ou só dígitos */
export function formatPhone(v: string): string {
  const d = onlyDigits(v);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return v;
}

export const isValidBrPhone = (v: string) => {
  const n = onlyDigits(v).length;
  return n === 10 || n === 11;
};
