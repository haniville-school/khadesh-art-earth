export function calculateTransactionFee(amount: number): number {
  if (amount <= 2500) return 0;
  const fee = Math.round(amount * 0.015) + 100;
  return Math.min(fee, 2000);
}