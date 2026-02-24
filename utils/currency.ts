export function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

export function formatNegativeCurrency(amount: number): string {
  return `-$${amount.toLocaleString()}`;
}
