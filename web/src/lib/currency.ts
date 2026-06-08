const RATES_TO_EUR: Record<string, number> = {
  EUR: 1,
  USD: 0.92,
  PLN: 0.23,
  GBP: 1.17,
}

export function toEur(amount: number, currency: string): number {
  const rate = RATES_TO_EUR[currency] ?? 1
  return amount * rate
}
