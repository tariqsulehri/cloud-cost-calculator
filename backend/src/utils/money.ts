export function getMonthlyHours(): number {
  const parsed = Number(process.env.MONTHLY_HOURS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 730;
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
