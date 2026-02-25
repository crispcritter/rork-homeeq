export function numericToString(value: number | null): string {
  if (value === null || value === undefined) return '';
  return String(value);
}

export function stringToNumeric(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  if (isNaN(parsed)) return null;
  return parsed;
}
