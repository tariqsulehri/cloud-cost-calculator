export function coverageBadgeClass(coveragePercent: number): string {
  if (coveragePercent >= 100) {
    return 'border-emerald-300 bg-emerald-100 text-emerald-800';
  }
  if (coveragePercent >= 80) {
    return 'border-sky-300 bg-sky-100 text-sky-800';
  }
  if (coveragePercent >= 50) {
    return 'border-amber-300 bg-amber-100 text-amber-900';
  }
  return 'border-red-300 bg-red-100 text-red-700';
}

export function coverageBadgeVariant(coveragePercent: number): 'active' | 'success' | 'warning' | 'danger' {
  if (coveragePercent >= 100) {
    return 'success';
  }
  if (coveragePercent >= 80) {
    return 'active';
  }
  if (coveragePercent >= 50) {
    return 'warning';
  }
  return 'danger';
}
